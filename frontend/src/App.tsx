// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css';

// RainbowKit configuration and theming
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme
} from '@rainbow-me/rainbowkit';

// wagmi providers and transport setup
import { WagmiProvider, http } from 'wagmi';
import { forma } from 'wagmi/chains';

// React Query client for caching and state management
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

// Core application components
import Grid from './components/Grid/Grid';
import BrandmarkAndStats from './components/Stats/BrandmarkAndStats';
import Wallet from './components/Wallet/Wallet';
import LastPaints from './components/Stats/LastPaints';
import { WebSocketProvider } from './context/WebSocketProvider';
import Warning from './components/Warning';

// Initialize wagmi configuration for Forma chain
const config = getDefaultConfig({
  appName: 'MamoArt',
  projectId: '555f8c9a50c43c6d84e1bcdc13208bba',
  chains: [forma],
  transports: {
    [forma.id]: http('https://rpc.forma.art'),
  },
  ssr: false
});

// Initialize react-query client
const queryClient = new QueryClient();

// Extend wagmi config typings to register custom config object
declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

// Main application component wrapped with all context providers
function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" theme={darkTheme()} coolMode>
          <WebSocketProvider>
            <Warning />
            <BrandmarkAndStats />
            <Wallet />
            <Grid />
            <LastPaints />
          </WebSocketProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;