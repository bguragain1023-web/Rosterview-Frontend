import './App.css'
import { Login } from './pages/Login'
import { Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; 
import { Layout } from './components/layout/Layout';
import { Staff } from './pages/Staff';
import { Coordinator } from './pages/Coordinator';
import { PrivateRoutes } from './components/Private/PrivateRoutes';
function App() {


  return (
<>
<div className="">
<Routes>

  <Route path="/" element={<Layout />}>
  <Route index element={<Login />} />

  <Route element ={<PrivateRoutes/>}>
   <Route path = "Staff" element={<Staff/>} />
  <Route path = "admin" element={<Coordinator/>} />
  
  </Route>
 
  
  
  </Route>
</Routes>
<ToastContainer/>

</div>



</>
  )
}

export default App
