import type { Metadata } from "next";
import { PinForm } from "./pin-form";

export const metadata: Metadata = {
  title: "Ingresar",
};

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Ingresar</h1>
      <p className="mt-2 text-center text-muted-foreground">
        Escribí tu PIN de 4 dígitos para entrar.
      </p>
      <PinForm />
    </main>
  );
}
