import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from './emailjs.config';

export const initEmailJS = () => {
  // Initialize EmailJS with the public key from config
  emailjs.init(EMAILJS_CONFIG.publicKey);
};

export default emailjs; 