import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
export async function createSession(userId:string) { const raw=crypto.randomUUID()+crypto.randomUUID(); const hash=await bcrypt.hash(raw,10); await db.session.create({data:{userId,tokenHash:hash,expiresAt:new Date(Date.now()+1000*60*60*12)}}); (await cookies()).set("rd_session",raw,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*12}); }
export async function currentUser() { const raw=(await cookies()).get("rd_session")?.value; if(!raw)return null; const sessions=await db.session.findMany({include:{user:true},where:{expiresAt:{gt:new Date()}}}); for(const s of sessions) if(await bcrypt.compare(raw,s.tokenHash)) return s.user; return null; }
export function requireRole(user:{role:string}|null, roles:string[]) { if(!user || !roles.includes(user.role)) throw new Error("Unauthorized"); }
