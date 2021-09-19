package main

import (
	"io"
	"net"
    "fmt"
    "os"
    "time"
)

var (
    localAddr = ":25566"
    remoteAddr = "172.18.0.22:25565"
    remoteBackupAddr = "192.168.1.182:9999"
)

type Proxy struct {
	sentBytes               uint64
	receivedBytes           uint64
	laddr, raddr, rbakaddr  *net.TCPAddr
	lconn, rconn            io.ReadWriteCloser
	erred                   bool
	errsig                  chan bool
}

// New - Create a new Proxy instance. Takes over local connection passed in,
// and closes it when finished.
func New(lconn *net.TCPConn, laddr, raddr, rbakaddr *net.TCPAddr) *Proxy {
	return &Proxy{
		lconn:  lconn,
		laddr:  laddr,
		raddr:  raddr,
        rbakaddr: rbakaddr,
		erred:  false,
		errsig: make(chan bool),
	}
}

type setNoDelayer interface {
	SetNoDelay(bool) error
}

// Start - open connection to remote and start proxying data.
func (p *Proxy) Start() {
	defer p.lconn.Close()

	var err error
	
	// check remote
	
	conaddr := p.raddr
	
	conn, err := net.DialTimeout("tcp", remoteAddr, time.Second)
    if err != nil {
        fmt.Println("Connecting error:", err)
        conaddr = p.rbakaddr
    }
    if conn != nil {
        conn.Close()
    }
	
	//connect to remote
	
    p.rconn, err = net.DialTCP("tcp", nil, conaddr)
	if err != nil {
		fmt.Printf("Remote connection failed: %s\n", err)
		return
	}
	defer p.rconn.Close()

	//display both ends
	fmt.Printf("Opened %s >>> %s\n", p.laddr.String(), conaddr.String())

    doneChan := make(chan bool) // TODO
    
	//bidirectional copy
	go p.pipe(p.lconn, p.rconn, doneChan)
	go p.pipe(p.rconn, p.lconn, doneChan)

	//wait for close...
	<-p.errsig
	fmt.Printf("Closed (%d bytes sent, %d bytes recieved)\n", p.sentBytes, p.receivedBytes)
    
    time.Sleep(5 * time.Second)
    
    fmt.Println("Restarting connection...")
    p.Start()
}

func (p *Proxy) err(s string, err error) {
	if p.erred {
		return
	}
	if err != io.EOF {
		fmt.Println(s, err)
	}
	p.errsig <- true
	p.erred = true
}

func (p *Proxy) pipe(src, dst io.ReadWriter, done chan bool) {
    islocal := src == p.lconn

	//directional copy (64k buffer)
	buff := make([]byte, 0xffff)
	for {
		n, err := src.Read(buff)
		if err != nil {
			p.err("Read failed '%s'\n", err)
			return
		}
		b := buff[:n]

		//write out result
		n, err = dst.Write(b)
		if err != nil {
			p.err("Write failed '%s'\n", err)
			return
		}
		if islocal {
			p.sentBytes += uint64(n)
		} else {
			p.receivedBytes += uint64(n)
		}
	}
    
	//directional copy (64k buffer)
// 	buff := make([]byte, 0xffff)
    
//     readStatChan := make(chan bool)
//     p.read(src, dst, buff, done) 
//     
// 	for {
//         select {
//         case <-readStatChan:
//             p.read(src, dst, buff, done)
//         case <-done:
//             break
//         }
// 	}
}

// func (p *Proxy) read(src, dst io.ReadWriter, buff []byte, done chan bool) {
// 	islocal := src == p.lconn
// 
//     n, err := src.Read(buff)
//     if err != nil {
//         p.err("Read failed '%s'\n", err)
//         return
//     }
//     b := buff[:n]
// 
//     //write out result
//     n, err = dst.Write(b)
//     if err != nil {
//         p.err("Write failed '%s'\n", err)
//         return
//     }
//     if islocal {
//         p.sentBytes += uint64(n)
//     } else {
//         p.receivedBytes += uint64(n)
//     }
//     done <- true
// }

func main() {
    fmt.Println("Starting proxy...")
    
    laddr, err := net.ResolveTCPAddr("tcp", localAddr)
	if err != nil {
		fmt.Println("Failed to resolve local address: ")
        fmt.Println(err)
		os.Exit(1)
	}
	raddr, err := net.ResolveTCPAddr("tcp", remoteAddr)
	if err != nil {
		fmt.Println("Failed to resolve remote address:")
        fmt.Println(err)
		os.Exit(1)
	}
	rbakaddr, err := net.ResolveTCPAddr("tcp", remoteBackupAddr)
	if err != nil {
		fmt.Println("Failed to resolve remote backup address:")
		fmt.Println(err)
        os.Exit(1)
	}
	listener, err := net.ListenTCP("tcp", laddr)
	if err != nil {
		fmt.Println("Failed to open local port to listen:")
		fmt.Println(err)
        os.Exit(1)
	}

	var p* Proxy
	
	for {
        fmt.Println("Starting TCP server...")
        
		conn, err := listener.AcceptTCP()
		if err != nil {
			fmt.Println("Failed to accept connection '%s'", err)
			continue
		}

        p = New(conn, laddr, raddr, rbakaddr)

		go p.Start()
	}
}
