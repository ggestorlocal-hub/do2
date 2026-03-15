import React, { useState, useEffect, useRef } from 'react';
import { Heart, Menu, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Navbar = () => (
  <nav className="bg-white text-slate-900 h-14 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center font-bold text-white text-lg">
        V
      </div>
      <span className="text-lg font-bold tracking-tight">Vakinha</span>
    </div>
    <div className="flex items-center gap-3">
      <button className="p-2 hover:opacity-80 transition-opacity">
        <Search className="w-5 h-5" />
      </button>
      <button className="p-2 hover:opacity-80 transition-opacity">
        <Menu className="w-5 h-5" />
      </button>
    </div>
  </nav>
);

const donors = [
  { name: "Maria S.", amount: 50, time: "há 2 minutos", msg: "Força, Minas! 🙏" },
  { name: "João Pedro", amount: 200, time: "há 5 minutos", msg: "Que Deus abençoe todos vocês!" },
  { name: "Ana Clara", amount: 100, time: "há 12 minutos", msg: "Espero que chegue a quem precisa 💛" },
  { name: "Carlos M.", amount: 30, time: "há 18 minutos", msg: "Pouco, mas de coração." },
  { name: "Fernanda Lima", amount: 500, time: "há 25 minutos", msg: "Minas sempre no meu coração!" },
  { name: "Rafael Souza", amount: 80, time: "há 32 minutos", msg: "Vamos ajudar pessoal!" },
  { name: "Patrícia R.", amount: 150, time: "há 45 minutos", msg: "Doando e compartilhando 🙌" },
  { name: "Lucas Oliveira", amount: 20, time: "há 1 hora", msg: "É pouco mas é honesto." },
  { name: "Camila Freitas", amount: 300, time: "há 1 hora", msg: "Que essa ajuda reconstrua vidas!" },
  { name: "Roberto Alves", amount: 100, time: "há 2 horas", msg: "Força MG! Estamos juntos." }
];

const INITIAL_AMOUNT = 587543.11;
const GOAL_AMOUNT = 1000000.00;

export default function Home() {
  const [activeTab, setActiveTab] = useState('sobre');
  const [currentAmount, setCurrentAmount] = useState(INITIAL_AMOUNT);
  const donorIndexRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const simulateDonation = () => {
      const donor = donors[donorIndexRef.current % donors.length];
      toast.success(`${donor.name} doou R$ ${donor.amount.toFixed(2)} 💛`, {
        description: "Agora mesmo",
        duration: 4000,
      });
      setCurrentAmount(prev => prev + donor.amount);
      donorIndexRef.current++;
    };

    const initialTimeout = setTimeout(simulateDonation, 5000);
    const interval = setInterval(() => {
      simulateDonation();
    }, 10000 + Math.random() * 5000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const progress = Math.round((currentAmount / GOAL_AMOUNT) * 100);

  const handleDonate = () => {
    navigate('/checkout' + window.location.search);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <p className="text-center text-slate-500 text-sm font-medium tracking-wider uppercase mb-3">
          CASA / MORADIA
        </p>
        
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
          Minas Gerais precisa da sua ajuda
        </h1>
        
        <p className="text-center text-slate-400 text-sm mb-5">
          ID: 59671PVEWLSCG
        </p>
        
        <div className="rounded-lg overflow-hidden mb-4 relative">
          <img 
            src="https://www.hojeemdia.com.br/image/policy:1.776247.1628827159:1628827159/image.jpg?f=2x1&w=1200" 
            alt="Imagem da enchente em Minas Gerais" 
            className="w-full h-auto object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Heart className="w-5 h-5 text-primary fill-primary" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">
                Ativo desde 24/02/2026
              </p>
              <p className="text-slate-500 text-sm">
                Criada por Gustavo Tubarão • 2.116 pessoas doaram para apoiar essa causa
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-primary font-bold text-sm">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-3xl font-bold text-primary">
            R$ {currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-slate-500 text-sm">
            de R$ {GOAL_AMOUNT.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="border-b border-slate-200 mb-6">
          <div className="flex gap-6">
            {[
              { key: 'sobre', label: 'Sobre' },
              { key: 'novidades', label: 'Novidades' },
              { key: 'quem', label: 'Quem ajudou' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "pb-3 text-sm font-medium transition-colors relative",
                  activeTab === tab.key ? "text-primary" : "text-slate-500 hover:text-slate-900"
                )}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {activeTab === 'sobre' && (
          <div className="space-y-4 text-slate-700 text-sm leading-relaxed text-justify">
            <p>
              <strong>Vaquinha criada em:</strong> 24/02/2026
            </p>
            <p>
              Nos últimos dias, a cidade de Ubá (MG) e outras localidades da Zona da Mata mineira foram devastadas por um temporal de proporções históricas. Chuvas intensas e persistentes provocaram enchentes, deslizamentos de terra e o transbordamento de rios, deixando um rastro de destruição por onde passaram.
            </p>
            <p>
              O volume de água foi tão extremo que casas desabaram, pontes foram destruídas, ruas ficaram tomadas pela lama e famílias inteiras perderam tudo o que tinham. Em muitos bairros, moradores ficaram ilhados e sem acesso a serviços básicos.
            </p>
            <p>
              Segundo as autoridades, o desastre deixou várias vítimas fatais, dezenas de desaparecidos e centenas de pessoas desabrigadas, que agora enfrentam um momento de sofrimento profundo.
            </p>
            <p>
              As equipes de resgate e voluntários seguem trabalhando sem parar, mas a necessidade de apoio é enorme, famílias precisam de abrigo, alimentação, roupas, água potável e apoio emocional neste momento tão difícil.
            </p>
            <p>
              Por isso, lançamos a Vakinha: para que, juntos, possamos ajudar quem perdeu tudo com essa tragédia. Cada contribuição, por menor que seja, fará diferença na vida de quem agora enfrenta um futuro incerto. Seu apoio pode ser o início de reconstrução de muitas histórias.
            </p>
            <p className="text-lg font-medium text-slate-900">
              💛 Doe, compartilhe e ajude a levar esperança a quem mais precisa.
            </p>
          </div>
        )}
        
        {activeTab === 'novidades' && (
          <div className="text-center text-slate-500 py-12 text-sm">
            Nenhuma novidade publicada ainda.
          </div>
        )}
        
        {activeTab === 'quem' && (
          <div className="space-y-4">
            {donors.map((donor, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-100/50 border border-slate-100">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {donor.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-900">{donor.name}</span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{donor.time}</span>
                  </div>
                  <p className="text-primary font-semibold text-xs">
                    R$ {donor.amount.toFixed(2)}
                  </p>
                  <p className="text-slate-600 text-sm mt-0.5">
                    {donor.msg}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={handleDonate}
            className="w-full bg-primary text-white font-semibold py-4 rounded-lg text-lg hover:opacity-90 transition-opacity"
          >
            Quero Ajudar
          </button>
        </div>
      </div>
    </div>
  );
}