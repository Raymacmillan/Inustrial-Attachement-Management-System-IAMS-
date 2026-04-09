import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { coordinatorService } from "../../services/coordinatorService";
import PartnerCard from "../../components/ui/PartnerCard";
import PartnerDetailPanel from "./PartnerDetailPanel";

export default function PartnerRegistry() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const data = await coordinatorService.getPartnerRegistry();
        setPartners(data || []);
      } catch (err) {
        console.error("Error loading partners:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPartners();
  }, []);

  const handleViewProfile = async (id) => {
    // Open the panel immediately with null — shows spinner inside while fetching
    setSelectedPartner(null);
    setIsPanelOpen(true);

    try {
      const details = await coordinatorService.getPartnerDetails(id);
      setSelectedPartner(details);
    } catch (err) {
      console.error("Error fetching partner details:", err);
      setIsPanelOpen(false);
    }
  };

  const handleClose = () => {
    setIsPanelOpen(false);
    // Wait for slide-out animation before clearing data
    setTimeout(() => setSelectedPartner(null), 500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin mb-4 text-brand-600" size={40} />
        <p className="font-bold text-gray-400 uppercase tracking-[0.2em] text-[10px]">
          Syncing Partner Network...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
        <div>
          <h1 className="font-display text-4xl text-brand-900 font-bold tracking-tight">
            Partner <span className="text-brand-600">Registry</span>
          </h1>
          <p className="text-gray-500 text-lg font-light">
            Managing UB Industry Hosts & Vacancies
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
        {partners.map((partner) => (
          <PartnerCard
            key={partner.id}
            partner={partner}
            onViewProfile={handleViewProfile}
          />
        ))}
      </div>

      <PartnerDetailPanel
        isOpen={isPanelOpen}
        onClose={handleClose}
        partner={selectedPartner}
      />
    </div>
  );
}