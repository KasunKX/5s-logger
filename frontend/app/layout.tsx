import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/space-grotesk";
import "./globals.css";
export const metadata:Metadata={title:"SiteSight — Visual 5S intelligence",description:"A professional concept for evidence-led workplace improvement.",icons:{icon:"/favicon.svg"},openGraph:{title:"SiteSight — Visual 5S intelligence",description:"See the workplace. Improve what matters.",images:["/og.png"]},twitter:{card:"summary_large_image",title:"SiteSight — Visual 5S intelligence",description:"See the workplace. Improve what matters.",images:["/og.png"]}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
