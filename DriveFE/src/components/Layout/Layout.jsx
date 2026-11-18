import { Outlet } from 'react-router-dom';
import TopNavbar from '../TopNavbar/TopNavbar';
import SideBar from '../SideBar/SideBar';

function Layout() {
  return (
    <>
      <TopNavbar />
      <SideBar />
      <div className="main-content">
        <Outlet />
      </div>
    </>
  );
}

export default Layout;
