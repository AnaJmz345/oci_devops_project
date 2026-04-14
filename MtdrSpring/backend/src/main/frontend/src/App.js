import { AuthProvider } from './authenticator/AuthContext';
import MainApp from './MainApp';


function App() {
  
    return (
      
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    );
}

export default App;