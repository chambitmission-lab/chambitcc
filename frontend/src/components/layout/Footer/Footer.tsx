import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>참빛교회</h3>
            <p>어둠 속에서 빛을 비추는 교회</p>
          </div>
          <div className="footer-section">
            <h4>연락처</h4>
            <p>Tel: 032-323-1004</p>
          </div>
          <div className="footer-section">
            <h4>주소</h4>
            <p>(14542) 경기도 부천시 송내대로265번길 29</p>
            <p>(상동, 참빛교회)</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>copyright ⓒ 참빛교회 All rights reserved. Provided By교회사랑넷</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
