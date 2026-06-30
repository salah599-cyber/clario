export function assertStatusNotExited(status: string) {
  if (status === "EXITED") {
    throw new Error("Use Record Exit to mark an asset as exited.");
  }
}
