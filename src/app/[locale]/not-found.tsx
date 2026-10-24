import Link from "next/link";
import { LogoMark } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      <LogoMark className="size-12 text-ink/40" />
      <p className="font-display mt-8 text-7xl">404</p>
      <h1 className="mt-4 text-lg">این صفحه پیدا نشد · This page could not be found</h1>
      <Link href="/" className="mt-10 inline-flex h-12 items-center rounded-md bg-ink px-8 font-medium text-paper">
        عسل نوجا · Asal Noja
      </Link>
    </div>
  );
}
