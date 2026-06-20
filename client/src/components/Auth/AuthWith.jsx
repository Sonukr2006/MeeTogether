import { FaGithub, FaGoogle } from "react-icons/fa";
import { PiDotsSixBold } from "react-icons/pi";
import { useAlert } from '../../contexts/AlertProvider';

const AuthWith = ({type}) => {
  const { showAlert } = useAlert();

  return (
    <div className='backdrop-blur-xl bg-white/5 border border-white/10 p-1 rounded-2xl shadow-2xl w-[360px] relative z-10'>
        <p className='text-center text-gray-400'>{type} with your social account</p>

        <div className='flex items-center justify-center gap-4 mt-1'>
            <button className='flex items-center gap-2 px-4 py-3  rounded-lg text-white hover:bg-[#1e293b]/80 transition'>
                <FaGoogle size={22} />
            </button>
            <button className='flex items-center gap-2 px-4 py-3  rounded-lg text-white hover:bg-[#1e293b]/80 transition'>
                <FaGithub size={22} />
            </button>
            <button onClick={() => showAlert("Choose your other accounts.", "info")} className='flex items-center gap-2 px-4 py-3  rounded-lg text-white hover:bg-[#1e293b]/80 transition'>
                <PiDotsSixBold size={22} />   
            </button>
        </div>  
    </div>
  )
}

export default AuthWith