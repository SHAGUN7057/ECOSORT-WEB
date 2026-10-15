import { ArrowRight, Bot, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Login() {
  const navigate = useNavigate()
  function openDemo() {
    localStorage.setItem('ecosort_token', 'demo')
    localStorage.setItem('ecosort_demo', '1')
    navigate('/')
  }

  return <main className="login-page"><section className="login-hero"><div className="hero-nav"><div className="brand"><div className="brand-mark"><Bot size={21}/></div><div><b>EcoSort</b><span>Municipal console</span></div></div><span className="secure-label"><ShieldCheck size={15}/>DEMO ACCESS</span></div><div className="hero-copy"><p className="eyebrow">SMART CITY WASTE MANAGEMENT</p><h1>Run cleaner cities<br/><em>with clarity.</em></h1><p>Explore the EcoSort municipal operations portal.</p></div><div className="hero-visual"><div className="orbit orbit-1"/><div className="orbit orbit-2"/><div className="map-node n-1"/><div className="map-node n-2"/><div className="map-node n-3"/><span>MUNICIPAL NETWORK</span></div></section><section className="login-form-wrap"><div className="login-form"><div><p className="eyebrow">WELCOME</p><h2>Explore EcoSort</h2><p>Open the portal and explore the available workflows.</p></div><button className="primary-button full-width login-button" onClick={openDemo}>Click for Demo <ArrowRight size={17}/></button><div className="credential-note"><ShieldCheck size={16}/><span>Demo mode opens the portal without database authentication.</span></div></div></section></main>
}
