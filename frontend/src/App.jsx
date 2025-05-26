import './index.css'
import AppRouter from './Routes/AppRouter';
import { UserProvider } from './Context/User.context';

function App() {
  return (
    <UserProvider>
      <AppRouter/>
    </UserProvider>
   
  );
}


export default App;
