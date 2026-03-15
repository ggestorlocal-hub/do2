import React, { useState, useEffect } from 'react';
import { ChevronLeft, Info, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UpsellItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

const UPSELL_ITEMS: UpsellItem[] = [
  {
    id: 'cobertor',
    name: 'Cobertor',
    price: 10,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ12PwiHeA5T9ZBKgR2-mn4CXWsfqk1XXznPg&s'
  },
  {
    id: 'almoco',
    name: 'Almoço + Janta',
    price: 17,
    image: 'https://img.cdndsgni.com/preview/11315722.jpg'
  },
  {
    id: 'agua',
    name: 'Agua potavel',
    price: 3,
    image: 'https://cdn-icons-png.flaticon.com/512/3100/3100566.png'
  }
];

export default function Checkout() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<string>('0,00');
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [isPixSelected, setIsPixSelected] = useState(true);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') value = '0';
    const floatValue = parseInt(value) / 100;
    setAmount(floatValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
  };

  const toggleUpsell = (id: string) => {
    setSelectedUpsells(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getNumericAmount = () => {
    return parseFloat(amount.replace('.', '').replace(',', '.'));
  };

  const getUpsellTotal = () => {
    return UPSELL_ITEMS
      .filter(item => selectedUpsells.includes(item.id))
      .reduce((acc, item) => acc + item.price, 0);
  };

  const total = getNumericAmount() + getUpsellTotal();

  const handleContribute = () => {
    const numericAmount = getNumericAmount();
    if (numericAmount < 20) {
      toast.error('O valor mínimo da doação é de R$ 20,00');
      return;
    }
    toast.success('Redirecionando para o pagamento...');
    // Here you would navigate to the PIX screen or handle payment
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#1a1a1a] pb-20">
      {/* Header */}
      <header className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-[#00b67a] rounded flex items-center justify-center">
          <img 
            src="https://www.vakinha.com.br/assets/logo-vakinha-f90e9e6e.svg" 
            alt="Vakinha" 
            className="w-6 h-6 invert"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className="font-bold text-[#00b67a] text-xl">vakinha</span>
      </header>

      <main className="px-5 py-2 max-w-md mx-auto">
        <h1 className="text-2xl font-bold leading-tight mb-1">
          Minas Gerais precisa da sua ajuda
        </h1>
        <p className="text-[#999999] text-xs font-medium mb-6">
          ID: 59671PVEWLSCG
        </p>

        {/* Amount Input */}
        <div className="relative mb-2">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
            R$
          </div>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="w-full pl-12 pr-4 py-5 bg-white border border-slate-200 rounded-lg text-2xl font-bold outline-none focus:border-[#00b67a] transition-all"
          />
        </div>
        <p className="text-[#ff4d4d] text-[11px] font-bold mb-6">
          Valor mínimo da doação é de R$ 20,00
        </p>

        {/* Payment Method */}
        <div className="mb-8">
          <h3 className="font-bold text-sm mb-3">Forma de pagamento</h3>
          <button 
            onClick={() => setIsPixSelected(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all ${
              isPixSelected ? 'border-[#00b67a] bg-[#00b67a]/5' : 'border-slate-200'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              isPixSelected ? 'border-[#00b67a] bg-[#00b67a]' : 'border-slate-300'
            }`}>
              {isPixSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <span className="text-sm font-bold">Pix</span>
          </button>
        </div>

        {/* Upsell Section */}
        <div className="mb-8">
          <h3 className="font-bold text-sm mb-4">Turbine sua doação</h3>
          <div className="grid grid-cols-3 gap-2">
            {UPSELL_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleUpsell(item.id)}
                className={`relative p-3 rounded-lg border flex flex-col items-center text-center transition-all ${
                  selectedUpsells.includes(item.id) 
                    ? 'border-[#00b67a] bg-[#00b67a]/5' 
                    : 'border-slate-100 bg-white'
                }`}
              >
                {selectedUpsells.includes(item.id) && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-[#00b67a] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-8 h-8 mb-2 opacity-80 object-contain" 
                  referrerPolicy="no-referrer"
                />
                <p className="text-[10px] font-bold text-slate-700 leading-tight mb-1">{item.name}</p>
                <p className="text-[10px] text-slate-400 font-bold">R$ {item.price.toFixed(2).replace('.', ',')}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-3 mb-8 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-slate-500">Contribuição:</span>
            <span className="text-slate-900 font-bold">R$ {getNumericAmount().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-slate-500">Total:</span>
            <span className="text-slate-900 font-bold">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Contribute Button */}
        <button
          onClick={handleContribute}
          className="w-full bg-[#00b67a] text-white font-bold py-4 rounded-lg text-sm uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-[#00b67a]/20"
        >
          CONTRIBUIR
        </button>
      </main>

      {/* Bottom Nav Simulation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 flex justify-around items-center max-w-md mx-auto">
        <ChevronLeft className="w-6 h-6 text-slate-400" />
        <div className="flex gap-8">
          <div className="w-6 h-6 border-2 border-slate-200 rounded-sm" />
          <div className="w-6 h-6 border-2 border-slate-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}