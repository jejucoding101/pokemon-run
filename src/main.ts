import './styles.css';
import { WorldApp } from './render/WorldApp';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Missing #app root');
}

const app = new WorldApp(root);
app.start();
