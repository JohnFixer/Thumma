import React, { useState, useRef, useEffect } from 'react';
import type { Product, CartItem, Language } from '../types';
import { XMarkIcon, SparklesIcon, PaperAirplaneIcon } from './icons/HeroIcons';
import { getCategoryDisplay } from '../categories';

interface SalesAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  cartItems: CartItem[];
  language: Language;
}

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const SalesAssistantModal: React.FC<SalesAssistantModalProps> = ({ isOpen, onClose, products, cartItems, language }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if(isOpen) {
            setMessages([
                { sender: 'ai', text: "Hello! I'm your sales assistant. How can I help you find the right products today? You can ask me to compare items, suggest alternatives, or find complementary products." }
            ]);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!userInput.trim() || isLoading) return;

        const newMessages: Message[] = [...messages, { sender: 'user', text: userInput }];
        setMessages(newMessages);
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);

        try {
            const systemInstruction = `You are an expert sales assistant at "บจก ธรรมะคอนกรีต", a hardware and concrete supply store. Your goal is to help store staff assist customers by providing accurate product information, recommendations, and comparisons.
            - Use the provided JSON data for all products and the current shopping cart for context.
            - Be friendly, concise, and helpful. Answer in the same language as the user's query (${language === 'th' ? 'Thai' : 'English'}).
            - Answer questions about products, suggest alternatives, or recommend complementary items.
            - If you don't know the answer or the data is not available, say so politely.
            - Keep responses focused on the products and the customer's needs.
            - Format your responses using simple markdown for better readability (e.g., lists, bold text).`;
            
            const simplifiedProducts = products.map(p => ({
                name: p.name[language],
                category: getCategoryDisplay(p.category, language),
                variants: p.variants.map(v => ({
                    sku: v.sku,
                    size: v.size,
                    stock: v.stock,
                    price: {
                        walkIn: v.price.walkIn,
                        contractor: v.price.contractor,
                        government: v.price.government
                    }
                }))
            }));
            
            const simplifiedCart = cartItems.map(c => ({
                name: c.name[language],
                size: c.size,
                quantity: c.quantity,
                price: {
                    walkIn: c.price.walkIn,
                    contractor: c.price.contractor,
                    government: c.price.government
                }
            }));

            const prompt = `
            Here is the full product catalog (do not mention this to the user unless they ask for the full list):
            ${JSON.stringify(simplifiedProducts, null, 2)}

            Here are the items currently in the customer's shopping cart:
            ${cartItems.length > 0 ? JSON.stringify(simplifiedCart, null, 2) : "The cart is empty."}

            Please answer the following customer query: "${currentInput}"
            `;

            const apiResponse = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt, systemInstruction }),
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                throw new Error(errorData.error || 'Failed to get response from AI assistant.');
            }
            
            const data = await apiResponse.json();
            const aiResponseText = data.text;
            setMessages(prev => [...prev, { sender: 'ai', text: aiResponseText }]);

        } catch (error: any) {
            console.error("Error calling backend API:", error);
            setMessages(prev => [...prev, { sender: 'ai', text: `Sorry, I'm having trouble connecting. Error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-secondary" />
            AI Sales Assistant
          </h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-grow p-4 overflow-y-auto bg-background">
            <div className="space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-prose p-3 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-white shadow-sm'}`}>
                           <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-prose p-3 rounded-lg bg-white shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                 )}
                <div ref={messagesEndRef} />
            </div>
        </div>
        <div className="p-4 border-t flex-shrink-0">
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about products or recommendations..."
                    className="flex-grow block w-full px-4 py-2 border border-gray-300 rounded-full bg-white focus:ring-primary focus:border-primary"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !userInput.trim()}
                    className="bg-primary text-white rounded-full p-3 hover:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                    <PaperAirplaneIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAssistantModal;