import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProposals } from '../api/gasApi';

const SELLERS = {
  fop_pastushok: {
    id: "fop_pastushok",
    shortName: "ФОП Пастушок М. В.",
    fullName: "ФОП Пастушок Марія Володимирівна",
    office: "Львівська обл., м. Золочів, вул. І. Труша 1Б",
    phone: "(067) 374-08-12",
  },
  tov_cso: {
    id: "tov_cso",
    shortName: 'ТОВ "ЦСО"',
    fullName: 'ТОВ "Центр сервісного обслуговування"',
    office: "Львівська обл., м. Золочів, вул. І. Труша 1Б",
    phone: "(067) 374-08-02",
  },
};

/**
 * Сторінка для перегляду та друку комерційної пропозиції.
 * Дизайн адаптований для друку на А4.
 */
export default function ProposalView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeliveryMode, setIsDeliveryMode] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await getProposals();
        if (result?.success) {
          const found = result.proposals.find(p => p.id === id);
          setProposal(found);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div style={{ padding: '20px' }}>Завантаження...</div>;
  if (!proposal) return <div style={{ padding: '20px' }}>КП не знайдена</div>;

  const subtotal = proposal.items.reduce((acc, item) => acc + (parseFloat(item.price) * parseFloat(item.quantity) || 0), 0);
  const discount = proposal.discountType === 'percentage' 
    ? subtotal * (parseFloat(proposal.discountValue) / 100)
    : parseFloat(proposal.discountValue);

  const currentSeller = SELLERS[proposal.sellerId] || SELLERS.fop_pastushok;
  const currencySymbol = proposal.currency === 'USD' ? '$' : proposal.currency === 'EUR' ? '€' : 'грн';

  return (
    <div className="proposal-print-container">
      <style>{`
        .proposal-print-container {
          background: white;
          padding: 40px;
          max-width: 800px;
          margin: 20px auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          color: #333;
          font-family: 'Inter', sans-serif;
        }
        @media print {
          body { background: white; }
          .proposal-print-container { margin: 0; box-shadow: none; width: 100%; max-width: none; }
          .no-print { display: none; }
        }
        .print-header { display: flex; justify-content: space-between; border-bottom: 2px solid #f09433; padding-bottom: 20px; margin-bottom: 30px; }
        .logo-box img { height: 60px; }
        .pro-info { text-align: right; }
        .pro-number { font-size: 24px; font-weight: 800; color: #f09433; }
        .client-section { margin-bottom: 30px; }
        .section-title { font-weight: 700; text-transform: uppercase; font-size: 14px; color: #777; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { background: #f9f9f9; text-align: left; padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
        .items-table td { padding: 10px; border-bottom: 1px solid #f9f9f9; font-size: 14px; }
        .totals-section { margin-left: auto; width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .total-row.grand { border-top: 2px solid #f09433; margin-top: 10px; font-weight: 800; font-size: 18px; color: #f09433; }
        .footer-note { margin-top: 50px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
      `}</style>

      <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn btn-outline" onClick={() => navigate('/proposals')}>⬅️ Назад</button>
        <button className={`btn ${!isDeliveryMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => setIsDeliveryMode(false)}>📄 Комерційна пропозиція</button>
        <button className={`btn ${isDeliveryMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => setIsDeliveryMode(true)}>📦 Видаткова накладна</button>
        <button className="btn btn-success" onClick={() => window.print()}>🖨️ Друкувати</button>
      </div>

      <div className="print-header">
        <div className="logo-box">
          <img src="https://i.ibb.co/32JD4dc/logo.png" alt="CSO Solar" />
          <div style={{ fontWeight: 700, fontSize: '18px', marginTop: '5px' }}>{currentSeller.fullName}</div>
          <div style={{ fontSize: '12px' }}>{currentSeller.office} | {currentSeller.phone}</div>
        </div>
        <div className="pro-info">
          <div className="pro-number">
            {isDeliveryMode ? 'Видаткова накладна' : 'КП'} №{proposal.id.slice(-6).toUpperCase()}
          </div>
          <div style={{ fontWeight: 600 }}>від {new Date(proposal.date).toLocaleDateString('uk-UA')}</div>
        </div>
      </div>

      <div className="client-section">
        <div className="section-title">Замовник</div>
        <div style={{ fontWeight: 700, fontSize: '18px' }}>{proposal.clientName}</div>
        <div style={{ color: '#555' }}>{proposal.clientPhone}</div>
      </div>

      <table className="items-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>№</th>
            <th>Найменування товару</th>
            <th style={{ textAlign: 'center' }}>К-сть</th>
            {!isDeliveryMode && <th style={{ textAlign: 'right' }}>Ціна ({currencySymbol})</th>}
            {!isDeliveryMode && <th style={{ textAlign: 'right' }}>Сума ({currencySymbol})</th>}
          </tr>
        </thead>
        <tbody>
          {proposal.items.map((item, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td style={{ fontWeight: 600 }}>{item.productName}</td>
              <td style={{ textAlign: 'center' }}>{item.quantity} {item.unit}</td>
              {!isDeliveryMode && <td style={{ textAlign: 'right' }}>{new Intl.NumberFormat('uk-UA').format(item.price)}</td>}
              {!isDeliveryMode && <td style={{ textAlign: 'right' }}>{new Intl.NumberFormat('uk-UA').format(item.total)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      {!isDeliveryMode && (
        <div className="totals-section">
          <div className="total-row">
            <span>Сума:</span>
            <span>{new Intl.NumberFormat('uk-UA').format(subtotal)} {currencySymbol}</span>
          </div>
          {discount > 0 && (
            <div className="total-row" style={{ color: 'var(--danger)' }}>
              <span>Знижка:</span>
              <span>-{new Intl.NumberFormat('uk-UA').format(discount)} {currencySymbol}</span>
            </div>
          )}
          <div className="total-row grand">
            <span>ВСЬОГО:</span>
            <span>{new Intl.NumberFormat('uk-UA').format(proposal.totalAmount)} {currencySymbol}</span>
          </div>
        </div>
      )}

      {proposal.statusComment && !isDeliveryMode && (
         <div style={{ marginTop: '20px', padding: '15px', background: '#fafafa', borderRadius: '4px' }}>
            <div className="section-title">Примітки</div>
            <div style={{ fontSize: '14px' }}>{proposal.statusComment}</div>
         </div>
      )}

      <div className="footer-note">
        {isDeliveryMode ? (
          <>
            Товар отримано в повному обсязі, претензій до якості не маю.
            <br />
            Підпис отримувача: __________________________
          </>
        ) : (
          <>
            КП дійсна протягом 5 банківських днів. Дякуємо за звернення до нашої компанії!
            <br />
            Сайт: cso-solar.com.ua | Консультації: +38 (067) 123-45-67
          </>
        )}
      </div>
    </div>
  );
}
