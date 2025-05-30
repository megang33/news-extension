import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Info from './Info';
import './App.css';

function App() {
  return (
    <Router initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/info" element={<Info />} />
      </Routes>
    </Router>
  )
}

export default App