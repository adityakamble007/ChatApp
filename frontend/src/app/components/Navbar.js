import React from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-semibold">ChatApp</div>
        <ul className="flex space-x-4">
          <li>
            <Link href="/" className="hover:text-gray-300">
              Home
            </Link>
          </li>
          <li>
            <Link href="/chats" className="hover:text-gray-300">
              Chats
            </Link>
          </li>
          {/* <li><Link href="/profile" class="hover:text-gray-300">Profile</Link></li> */}
          <li>
            <UserButton />
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
