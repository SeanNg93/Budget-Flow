import emailjs from '@emailjs/browser';

export const initEmailJS = () => {
  // Initialize EmailJS with your public key
  // Replace 'YOUR_PUBLIC_KEY' with your actual EmailJS public key
  emailjs.init('YOUR_PUBLIC_KEY');
};

export default emailjs; 