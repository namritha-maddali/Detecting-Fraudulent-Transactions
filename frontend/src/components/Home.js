import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import profile from './pfp.png';

import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const goToLogIn = () => {
    navigate('/welcome');
  };

  const goToNextSteps = () => {
    navigate('/next-steps');
  };

  const goToMyAccount = () => {
    navigate('/welcome');
  };

  const [currentSection, setCurrentSection] = useState(0);
  const [previousSection, setPreviousSection] = useState(null);
  const [scrollDirection, setScrollDirection] = useState('down');
  const isScrollingRef = useRef(false);
  const lastScrollY = useRef(window.scrollY);

  const titleColors = ['#063f03', '#063f03', '#063f03', '#e2ffe5'];

  const handleScroll = () => {
    if (!isScrollingRef.current) {
      isScrollingRef.current = true;
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
      setScrollDirection(direction);
      lastScrollY.current = currentScrollY;

      setTimeout(() => {
        const sectionHeight = window.innerHeight;
        const newSectionIndex = Math.round(window.scrollY / sectionHeight);
        
        if (newSectionIndex !== currentSection) {
          setPreviousSection(currentSection);
          setCurrentSection(newSectionIndex);
          window.scrollTo({
            top: newSectionIndex * sectionHeight,
            behavior: 'smooth',
          });
        }
        
        isScrollingRef.current = false;
      }, 150);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentSection]);

  const getSlideClass = (index) => {
    if (currentSection === index) return 'slide-enter';
    if (previousSection === index) {
      return scrollDirection === 'down' ? 'slide-exit-up' : 'slide-exit-down';
    }
    return scrollDirection === 'down' ? 'slide-hidden-down' : 'slide-hidden-up';
  };

  return (
    <div className="presentation-container">
      <span className={`title ${currentSection === 3 ? 'title-move-down' : ''}`}  style={{ color: titleColors[currentSection] }}>
        WATCH FOR FRAUD
      </span>
      <button className="profile-button" onClick={goToMyAccount} aria-label="Go to My Account">
        <img src={profile} className="profile" alt="Profile" />
      </button>
      <div className={`slide ${getSlideClass(0)}`} id="section1">
        <p>
          Fraudulent transactions involve unauthorized use of financial information. 
          They often result from phishing or card theft. 
          Regularly monitoring bank statements and practicing online security can help prevent fraud.
        </p>
      </div>
      <div className={`slide ${getSlideClass(1)}`} id="section2">
        <p>
          In 2023, global fraudulent transaction losses exceeded $32 billion, with online card fraud making up 70%. 
          Strengthening security and detection methods is essential to reducing these losses.
        </p>
      </div>
      <div className={`slide ${getSlideClass(2)}`} id="section3">
        <p>
          Awareness of fraudulent transactions is essential for protecting personal finances. 
          Knowing common fraud tactics empowers individuals to spot suspicious activity early, 
          helping prevent financial loss and identity theft
        </p>
      </div>
      <div className={`floating-text ${currentSection === 3 ? 'active' : 'inactive'}`} id="floating-text">
        <p> Take control and Protect your Finances </p>
      </div>
      <div className={`buttons ${currentSection === 3 ? 'active' : 'inactive'}`} id="buttons">
        <button onClick={goToLogIn} className='btn'> My Account </button>
        <button onClick={goToNextSteps} className='btn'> What can I do? </button>
      </div>
    </div>
  );
};

export default Home;
