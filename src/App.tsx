import './App.css'
import { Login } from './pages/Login'
import { Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; 
import { Layout } from './components/layout/Layout';
function App() {


  return (
<>
<ToastContainer/>
<Routes>

  <Route path="/" element={<Layout />}>
  <Route index element={<Login />} />
  
  
  </Route>
</Routes>


</>
  )
}

export default App
