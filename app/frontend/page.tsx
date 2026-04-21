"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FrontendPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      router.replace("/frontend/portal/formulas");
    } else {
      router.replace("/frontend/portal/login");
    }
  }, [router]);

  return <main style={{ padding: "24px" }}>Loading...</main>;
}