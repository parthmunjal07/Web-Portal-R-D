import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  
  if (process.env.DEMO_MODE === "true") {
    if (cookieStore.has("rd_demo")) {
      redirect("/dashboard");
    } else {
      redirect("/login");
    }
  }
  
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }
  
  redirect("/dashboard");
}
