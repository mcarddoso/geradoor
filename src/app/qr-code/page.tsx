"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react"; // Importando corretamente
import NavbarSection from "@/components/NavbarSection";
import { ArrowLeft, Loader } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const QRCodeGenerator: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const [qrCodeValue, setQrCodeValue] = useState<string | null>("");
  const [loadingQrCode, setLoadingQrCode] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme || "dark");
    }
  }, [theme]);

  const handleGenerate = async () => {
    if (!inputValue) {
      toast.error("Por favor, preencha o link antes de gerar o QR Code");
      return;
    }

    const shortcode = uuidv4().slice(0, 6);
    const baseUrl = "https://www.geradoor.com/";

    try {
      setLoadingQrCode(true);
      const response = await fetch("/api/qrcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputValue, shortcode }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar QR Code");
      }

      const data = await response.json();
      setQrCodeValue(baseUrl + data.shortcode);
      setLoadingQrCode(false);
      toast.success("QR Code criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar QR Code:", error);
      toast.error("Erro ao criar QR Code");
      setLoadingQrCode(false);
    }
  };

  const downloadQRCode = (filetype: string) => {
    const svgElement = document.querySelector(".qrcode-svg");
  
    if (!svgElement) {
      toast.error("QR Code não encontrado!");
      return;
    }
  
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  
    if (filetype === "svg") {
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "qrcode.svg";
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const img = new Image();
      img.onload = () => {
        const scale = 4;
        const size = 200;
  
        canvas.width = size * scale;
        canvas.height = size * scale;
  
        ctx?.scale(scale, scale);
        ctx?.drawImage(img, 0, 0, size, size);
  
        if (filetype === "png") {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "qrcode.png";
              link.click();
              URL.revokeObjectURL(url);
            }
          }, "image/png");
        } else if (filetype === "pdf") {
          import("jspdf").then((jsPDF) => {
            const pdf = new jsPDF.default();
            const imgData = canvas.toDataURL("image/png");
            pdf.addImage(imgData, "PNG", 10, 10, 180, 180);
            pdf.save("qrcode.pdf");
          });
        }
      };
  
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };  


  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen relative overflow-hidden px-8">
      <motion.div
        className="pattern absolute inset-0 -z-10 h-full w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      ></motion.div>
      <NavbarSection />

      {(!qrCodeValue && !loadingQrCode) && (
        <motion.div
          className="max-w-screen-md w-full h-full flex flex-col space-y-2 items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex flex-col items-center justify-center space-y-3 my-5">
            <h1 className="text-4xl font-semibold tracking-tighter">Gerador de QRCode</h1>
            <p className="text-lg text-zinc-700 dark:text-zinc-400 font-normal leading-6 tracking-tighter text-center">
              Preencha o link que deseja
              <br />
              para criar um QRCode
            </p>
          </div>
          <div className="flex space-x-2 w-full max-w-[320px] mx-auto">
            <Input
              type="text"
              placeholder="https://"
              className="bg-background"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
          <Button className="w-full max-w-[320px] mt-8" onClick={handleGenerate} disabled={inputValue == ""}>
            Criar
          </Button>
        </motion.div>
      )}

      { loadingQrCode && (
        <motion.div 
          className="flex items-center justify-center w-full h-full py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          >
          <Loader className="animate-spin rounded-full h-5 w-5"/>
        </motion.div>
      ) }

      {qrCodeValue && (
        <motion.div
          className="max-w-screen-md w-full h-full flex flex-col space-y-4 items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-[200px] w-full flex items-start">
            <Button variant='link' className="px-0" onClick={() => setQrCodeValue(null)}>
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </div>
          <div className="bg-white p-4">
            <QRCodeSVG
              value={qrCodeValue}
              size={180}
              className="qrcode-svg"
            />
          </div>
          <div className="flex flex-col gap-2 max-w-[200px] w-full mt-8">
            <Button variant='outline' onClick={() => downloadQRCode("png")}>PNG</Button>
            <Button variant='outline' onClick={() => downloadQRCode("pdf")}>PDF</Button>
            <Button variant='outline' onClick={() => downloadQRCode("svg")}>SVG</Button>
          </div>
        </motion.div>
      )}

    </div>
  );
};

export default QRCodeGenerator;
