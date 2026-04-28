import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import './Layout.css'
 
export default function Layout() {
  const [notifications, setNotifications] = useState([])
 
  return (
    <div className="layout">
      <Sidebar notifications={notifications} />
      <main className="main-content">
        <div className="content-wrapper">
          <Outlet context={{ notifications, setNotifications }} />
        </div>
      </main>
    </div>
  )
}