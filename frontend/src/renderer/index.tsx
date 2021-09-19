import React from 'react';
import { render } from 'react-dom';
import App from './App';
import { initializeIcons } from '@fluentui/font-icons-mdl2';

initializeIcons();
render(<App />, document.getElementById('root'));
