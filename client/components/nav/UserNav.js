import Link from "next/link";
import { useState, useEffect } from "react";

const UserNav = () => {

    //for active nav links 
    const [current, setCurrent] = useState("");

    //used for to select the option based on the url path
    useEffect(() => {
        process.browser && setCurrent(window.location.pathname);
      }, [process.browser && window.location.pathname]);

    return (
        <div className="nav flex-column nav-pills">
            <Link href="/user">
            <a className={`nav-link ${current === "/user" && "active"}`}>Dashboard</a>
            </Link>
        </div>
    );
};

export default UserNav;