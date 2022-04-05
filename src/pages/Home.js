import Header from '../components/Header'
import Meta from '../components/Meta'

const Home = () => {
  // page content
  const pageTitle = 'MTC Admin Dashboard'
  const pageDescription = 'welcome to react bootstrap template'

  return (
    <div>
      <Meta title={pageTitle}/>
      <div className='starter-template text-center mt-5'>
        <h1>MTC Admin Dashboard</h1>
        <p className='lead'>Select a tool from the menu above.<br/>Only authorized wallets can perform functions on this site.</p>
      </div>
    </div>
  )
}

export default Home