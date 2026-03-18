import React from "react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import Image from "next/image";
import Link from "next/link";

const Header = async() => {

  const user = null;
  return (
    <header className="fixed top-0 w-full border-b border-stone-200 bg-stone-50/80 backdrop-blur-md z-50 supports-backdrop-filter:bg-stone-50/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">

        <Link href={user ? "/dashboard" : "/"}>
          <Image src = "/orangelogo.png" alt="logo" width={80} height={80} className="w-16"/>
        </Link>

        <div>NavLinks</div>
        <div className="flex space-x-4 item-center">

          <Show when="signed-in">
            <UserButton />
          </Show>

          <Show when="signed-out">
            <SignInButton mode = "modal">
              <Button variant = "ghost" className="text-stone-600 hover:text-orange-600 hover:bg-ornage-50 font-medium"> Sign In </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant = "primary" className="rounded-full px-6 "> Get Started </Button>
            </SignUpButton>
          </Show>
        </div>
      </nav>
    </header>
  );
}

export default Header;
