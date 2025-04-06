import React, { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import CreateTokenModal from "@/components/modals/CreateTokenModal";

const CreateToken = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <a className="inline-flex items-center text-[#c0c0c0] hover:underline mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to home
          </a>
        </Link>
        
        <div className="bg-[#181622] border border-[rgba(255,255,255,0.1)] rounded-lg p-8 text-center">
          <h1 className="text-2xl font-['Orbitron'] font-bold text-[#c0c0c0] mb-4">
            Create a new metal token
          </h1>
          
          <p className="text-[#a3a3a3] mb-6">
            Ready to launch your own metal-themed cryptocurrency? 
            Click below to get started with our token creation process.
          </p>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#c0c0c0] to-gray-500 text-[#242235] font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Launch Token Creator
          </button>
        </div>
        
        <CreateTokenModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </div>
  );
};

export default CreateToken;