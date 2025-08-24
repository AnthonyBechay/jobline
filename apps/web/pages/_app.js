
import Layout from '../components/Layout';

export default function App({ Component, pageProps }){
  // Public status page doesn't need layout nav
  const noLayout = Component.noLayout || false;
  const Wrap = noLayout ? ({children})=> <>{children}</> : Layout;
  return (
    <Wrap>
      <Component {...pageProps} />
    </Wrap>
  );
}
