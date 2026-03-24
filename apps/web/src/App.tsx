import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout.js';
import { HomePage } from '@/pages/HomePage.js';
import { SpellsPage } from '@/pages/SpellsPage.js';
import { SpellDetailPage } from '@/pages/SpellDetailPage.js';
import { BestiaryPage } from '@/pages/BestiaryPage.js';
import { MonsterDetailPage } from '@/pages/MonsterDetailPage.js';
import { CharactersPage } from '@/pages/CharactersPage.js';
import { CharacterBuilderPage } from '@/pages/CharacterBuilderPage.js';
import { CharacterSheetPage } from '@/pages/CharacterSheetPage.js';
import { CampaignsPage } from '@/pages/CampaignsPage.js';
import { CampaignBuilderPage } from '@/pages/CampaignBuilderPage.js';
import { CampaignDetailPage } from '@/pages/CampaignDetailPage.js';
import { EncounterBuilderPage } from '@/pages/EncounterBuilderPage.js';
import { DiceRollerPage } from '@/pages/DiceRollerPage.js';
import { MapsPage } from '@/pages/MapsPage.js';
import { MapUploaderPage } from '@/pages/MapUploaderPage.js';
import { MapDetailPage } from '@/pages/MapDetailPage.js';
import { HomebrewPage } from '@/pages/HomebrewPage.js';
import { HomebrewBuilderPage } from '@/pages/HomebrewBuilderPage.js';
import { AiPage } from '@/pages/AiPage.js';
import { LoginPage } from '@/pages/LoginPage.js';
import { RegisterPage } from '@/pages/RegisterPage.js';
import { NotFoundPage } from '@/pages/NotFoundPage.js';

import { ErrorBoundary } from '@/components/ErrorBoundary.js';
import { useAuthStore } from '@/store/auth.js';

export default function App() {
  const { user } = useAuthStore();

  return (
    <ErrorBoundary>
      <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />

      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        

        <Route path="/spells" element={<SpellsPage />} />
        <Route path="/spells/:id" element={<SpellDetailPage />} />
        <Route path="/bestiary" element={<BestiaryPage />} />
        <Route path="/bestiary/:id" element={<MonsterDetailPage />} />


        <Route path="/characters" element={<CharactersPage />} />
        <Route path="/characters/new" element={<CharacterBuilderPage />} />
        <Route path="/characters/:id" element={<CharacterSheetPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/campaigns/new" element={<CampaignBuilderPage />} />
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="/encounters" element={<EncounterBuilderPage />} />
        <Route path="/dice" element={<DiceRollerPage />} />
        <Route path="/maps" element={<MapsPage />} />
        <Route path="/maps/new" element={<MapUploaderPage />} />
        <Route path="/maps/:id" element={<MapDetailPage />} />
        <Route path="/homebrew" element={<HomebrewPage />} />
        <Route path="/homebrew/new" element={<HomebrewBuilderPage />} />
        <Route path="/ai" element={<AiPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Routes>
    </ErrorBoundary>
  );
}
