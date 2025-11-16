import React from 'react';
import { View } from '../../types';
import Card from '../common/Card';

interface HomeViewProps {
    setCurrentView: (view: View) => void;
}

const NavCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
}> = ({ title, description, icon, onClick }) => (
    <button onClick={onClick} className="w-full text-left group">
        <Card className="hover:!shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer h-full">
            <div className="flex flex-col items-center text-center p-4">
                <div className="mb-6 text-amber-600">
                    {icon}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-500 mt-2">{description}</p>
            </div>
        </Card>
    </button>
);

const InventoryIcon = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>
            {`
            .jar1, .jar2, .jar3 {
                opacity: 0;
                animation: pop-in 2.5s ease-in-out infinite;
            }
            .jar2 { animation-delay: 0.3s; }
            .jar3 { animation-delay: 0.6s; }
            @keyframes pop-in {
                0%, 100% { opacity: 0; transform: translateY(5px) scale(0.9); }
                30%, 70% { opacity: 1; transform: translateY(0) scale(1); }
            }
            `}
        </style>
        <path d="M4 21h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 14h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect className="jar1" x="6" y="9" width="3" height="4" rx="0.5" fill="#fcd34d"/>
        <rect className="jar2" x="10.5" y="16" width="3" height="4" rx="0.5" fill="#fcd34d"/>
        <rect className="jar3" x="15" y="2" width="3" height="4" rx="0.5" fill="#fcd34d"/>
    </svg>
);


const SalesIcon = () => (
     <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>
            {`
            .coin {
                animation: drop-coin 2.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
            }
            @keyframes drop-coin {
                0% { transform: translateY(-8px) rotate(0); opacity: 0; }
                20% { transform: translateY(0) rotate(0); opacity: 1; }
                80% { transform: translateY(8px) rotate(360deg); opacity: 1; }
                100% { transform: translateY(10px) rotate(360deg); opacity: 0; }
            }
            `}
        </style>
        <path d="M7.5 7.5L9 3h6l1.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 21h10l1.2-10H5.8L7 21z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <g className="coin">
            <circle cx="12" cy="7" r="2.5" fill="#fcd34d"/>
            <text x="10.5" y="8.2" fontFamily="sans-serif" fontSize="2.5" fill="#b45309" fontWeight="bold">$</text>
        </g>
    </svg>
);

const DashboardIcon = () => (
    <svg width="64" height="64" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <style>
            {`
            .pie-slice {
                transform-origin: center;
                animation: draw-pie 2s cubic-bezier(0.5, 0, 0.5, 1) infinite alternate;
            }
            .pie-slice.two { animation-delay: 0.2s; }
            .pie-slice.three { animation-delay: 0.4s; }

            @keyframes draw-pie {
                from { stroke-dashoffset: 100; }
                to { stroke-dashoffset: 0; }
            }
            `}
        </style>
        <circle r="15.915" cx="18" cy="18" fill="transparent" stroke="#fef3c7" strokeWidth="3.8"></circle>
        <circle className="pie-slice one" r="15.915" cx="18" cy="18" fill="transparent" stroke="#fbbf24" strokeWidth="4" strokeDasharray="40 100" strokeDashoffset="100"></circle>
        <circle className="pie-slice two" r="15.915" cx="18" cy="18" fill="transparent" stroke="#fcd34d" strokeWidth="4" strokeDasharray="30 100" strokeDashoffset="100" transform="rotate(144, 18, 18)"></circle>
        <circle className="pie-slice three" r="15.915" cx="18" cy="18" fill="transparent" stroke="#fde68a" strokeWidth="4" strokeDasharray="25 100" strokeDashoffset="100" transform="rotate(252, 18, 18)"></circle>
    </svg>
);

const FixedCostIcon = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>
            {`
            .btn1, .btn2, .btn3 {
                animation: press-btn 2.2s ease-in-out infinite;
            }
            .btn2 { animation-delay: 0.35s; }
            .btn3 { animation-delay: 0.7s; }
            @keyframes press-btn {
                0%, 100% { transform: translateY(0); }
                15%, 45% { transform: translateY(0.8px); }
            }
            `}
        </style>
        <rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="8" y="5" width="8" height="4" rx="1" fill="#fef3c7"/>
        <circle className="btn1" cx="9" cy="12.5" r="1" fill="#fcd34d"/>
        <circle className="btn2" cx="15" cy="12.5" r="1" fill="#fcd34d"/>
        <circle className="btn2" cx="9" cy="15.5" r="1" fill="#fcd34d"/>
        <circle className="btn3" cx="15" cy="15.5" r="1" fill="#fcd34d"/>
        <rect className="btn1" x="8" y="17.5" width="8" height="2" rx="1" fill="#fcd34d"/>
    </svg>
);


const HomeView: React.FC<HomeViewProps> = ({ setCurrentView }) => {
    return (
        <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-2">
                Bienvenido de vuelta
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mb-12">
                ¿Qué te gustaría hacer hoy?
            </p>

            <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
                <NavCard
                    title="Gestionar Inventario"
                    description="Controla materias primas, recetas, productos y mermas."
                    icon={<InventoryIcon />}
                    onClick={() => setCurrentView('inventory')}
                />
                <NavCard
                    title="Registrar Ventas"
                    description="Anota ventas, gestiona clientes y crea propuestas."
                    icon={<SalesIcon />}
                    onClick={() => setCurrentView('sales')}
                />
                <NavCard
                    title="Dashboard"
                    description="Visualiza métricas clave y el rendimiento de tu negocio."
                    icon={<DashboardIcon />}
                    onClick={() => setCurrentView('dashboard')}
                />
                <NavCard
                    title="Costos Fijos"
                    description="Define y administra tus costos fijos mensuales."
                    icon={<FixedCostIcon />}
                    onClick={() => setCurrentView('fixedCosts')}
                />
            </div>
        </div>
    );
};

export default HomeView;