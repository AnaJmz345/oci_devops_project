
import { AuthProvider} from './AuthContext';
import {MainApp} from 'MainApp.js'


function App() {
  
    return (
      
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    );
}

export default App;