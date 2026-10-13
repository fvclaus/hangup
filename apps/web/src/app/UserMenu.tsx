"use client";

import Link from "next/link";
import clsx from "clsx";
import {
  AuthenticatedUserInfo,
  LOGOUT_URL,
  MEETINGS_URL,
  SETTINGS_URL,
} from "@hangup/shared";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";

type NextLinkArgs = Parameters<typeof Link>;

const userMenuLinkFactory = (setUserMenuVisible: (value: boolean) => void) =>
  React.forwardRef<HTMLAnchorElement, NextLinkArgs[0]>(
    ({ className, ...props }, ref) => {
      return (
        <Link
          onClick={() => {
            setUserMenuVisible(false);
          }}
          role="menuitem"
          prefetch={false}
          ref={ref}
          {...props}
          className={cn(
            className,
            "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100",
          )}
        />
      );
    },
  );

export default function UserMenu({
  userinfo,
}: {
  userinfo: AuthenticatedUserInfo;
}) {
  const [isUserMenuVisible, setUserMenuVisible] = useState<boolean>(false);
  const UserMenuLink = userMenuLinkFactory(setUserMenuVisible);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    setUserMenuVisible(false);
  }, [pathname, searchParams]);

  return (
    <div className="relative">
      <button
        id="user-menu-button"
        aria-haspopup={isUserMenuVisible}
        aria-controls="user-menu"
        aria-label="User Menu"
        className="btn btn-ghost btn-circle avatar"
        onClick={() => {
          setUserMenuVisible(!isUserMenuVisible);
        }}
      >
        <div className="w-10 rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Your profile picture" src={userinfo.picture} />
        </div>
      </button>
      <div
        id="user-menu"
        role="menu"
        aria-labelledby="user-menu-button"
        className={clsx(
          { invisible: !isUserMenuVisible },
          "absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
        )}
      >
        <div className="py-1">
          <UserMenuLink href={MEETINGS_URL}>My Meetings</UserMenuLink>
        </div>
        <div className="py-1">
          <UserMenuLink href={SETTINGS_URL}>Settings</UserMenuLink>
        </div>
        {/* TODO Add Icons? */}
        <div className="py-1">
          <UserMenuLink href={LOGOUT_URL}>Logout</UserMenuLink>
        </div>
        {/* Add Switch Account options */}
      </div>
    </div>
  );
}
