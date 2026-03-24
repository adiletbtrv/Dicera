import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout.js';
import { ErrorBoundary } from '@/components/ErrorBoundary.js';
import { useAuthStore } from '@/store/auth.js';

const HomePage = lazy(() => import('@/pages/HomePage.js').then((m) => ({ default: m.HomePage })));
const SpellsPage = lazy(() => import('@/pages/SpellsPage.js').then((m) => ({ default: m.SpellsPage })));
const SpellDetailPage = lazy(() => import('@/pages/SpellDetailPage.js').then((m) => ({ default: m.SpellDetailPage })));
const BestiaryPage = lazy(() => import('@/pages/BestiaryPage.js').then((m) => ({ default: m.BestiaryPage })));
const MonsterDetailPage = lazy(() => import('@/pages/MonsterDetailPage.js').then((m) => ({ default: m.MonsterDetailPage })));
const CharactersPage = lazy(() => import('@/pages/CharactersPage.js').then((m) => ({ default: m.CharactersPage })));
const CharacterBuilderPage = lazy(() => import('@/pages/CharacterBuilderPage.js').then((m) => ({ default: m.CharacterBuilderPage })));
const CharacterSheetPage = lazy(() => import('@/pages/CharacterSheetPage.js').then((m) => ({ default: m.CharacterSheetPage })));
const CampaignsPage = lazy(() => import('@/pages/CampaignsPage.js').then((m) => ({ default: m.CampaignsPage })));
const CampaignBuilderPage = lazy(() => import('@/pages/CampaignBuilderPage.js').then((m) => ({ default: m.CampaignBuilderPage })));
const CampaignDetailPage = lazy(() => import('@/pages/CampaignDetailPage.js').then((m) => ({ default: m.CampaignDetailPage })));
const EncounterBuilderPage = lazy(() => import('@/pages/EncounterBuilderPage.js').then((m) => ({ default: m.EncounterBuilderPage })));
const DiceRollerPage = lazy(() => import('@/pages/DiceRollerPage.js').then((m) => ({ default: m.DiceRollerPage })));
const MapsPage = lazy(() => import('@/pages/MapsPage.js').then((m) => ({ default: m.MapsPage })));
const MapUploaderPage = lazy(() => import('@/pages/MapUploaderPage.js').then((m) => ({ default: m.MapUploaderPage })));
const MapDetailPage = lazy(() => import('@/pages/MapDetailPage.js').then((m) => ({ default: m.MapDetailPage })));
const HomebrewPage = lazy(() => import('@/pages/HomebrewPage.js').then((m) => ({ default: m.HomebrewPage })));
const HomebrewBuilderPage = lazy(() => import('@/pages/HomebrewBuilderPage.js').then((m) => ({ default: m.HomebrewBuilderPage })));
const AiPage = lazy(() => import('@/pages/AiPage.js').then((m) => ({ default: m.AiPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage.js').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage.js').then((m) => ({ default: m.RegisterPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.js').then((m) => ({ default: m.NotFoundPage })));

const RacesPage = lazy(() => import('@/pages/RacesPage.js').then((m) => ({ default: m.RacesPage })));
const RaceDetailPage = lazy(() => import('@/pages/RaceDetailPage.js').then((m) => ({ default: m.RaceDetailPage })));
const ClassesPage = lazy(() => import('@/pages/ClassesPage.js').then((m) => ({ default: m.ClassesPage })));
const ClassDetailPage = lazy(() => import('@/pages/ClassDetailPage.js').then((m) => ({ default: m.ClassDetailPage })));
const BackgroundsPage = lazy(() => import('@/pages/BackgroundsPage.js').then((m) => ({ default: m.BackgroundsPage })));
const ConditionsPage = lazy(() => import('@/pages/ConditionsPage.js').then((m) => ({ default: m.ConditionsPage })));
const EquipmentPage = lazy(() => import('@/pages/EquipmentPage.js').then((m) => ({ default: m.EquipmentPage })));
const MagicItemsPage = lazy(() => import('@/pages/MagicItemsPage.js').then((m) => ({ default: m.MagicItemsPage })));
const FeatsPage = lazy(() => import('@/pages/FeatsPage.js').then((m) => ({ default: m.FeatsPage })));
const RulesPage = lazy(() => import('@/pages/RulesPage.js').then((m) => ({ default: m.RulesPage })));

const InitiativeTrackerPage = lazy(() => import('@/pages/tools/InitiativeTrackerPage.js').then((m) => ({ default: m.InitiativeTrackerPage })));
const SpellSlotsPage = lazy(() => import('@/pages/tools/SpellSlotsPage.js').then((m) => ({ default: m.SpellSlotsPage })));
const CrBudgetPage = lazy(() => import('@/pages/tools/CrBudgetPage.js').then((m) => ({ default: m.CrBudgetPage })));
const LootPage = lazy(() => import('@/pages/tools/LootPage.js').then((m) => ({ default: m.LootPage })));
const NameGeneratorPage = lazy(() => import('@/pages/tools/NameGeneratorPage.js').then((m) => ({ default: m.NameGeneratorPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
    </div>
  );
}

export default function App() {
  const { user } = useAuthStore();

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />

          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />

            <Route path="/spells" element={<SpellsPage />} />
            <Route path="/spells/:id" element={<SpellDetailPage />} />
            <Route path="/bestiary" element={<BestiaryPage />} />
            <Route path="/bestiary/:id" element={<MonsterDetailPage />} />
            <Route path="/races" element={<RacesPage />} />
            <Route path="/races/:id" element={<RaceDetailPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/classes/:id" element={<ClassDetailPage />} />
            <Route path="/backgrounds" element={<BackgroundsPage />} />
            <Route path="/conditions" element={<ConditionsPage />} />
            <Route path="/equipment" element={<EquipmentPage />} />
            <Route path="/magic-items" element={<MagicItemsPage />} />
            <Route path="/feats" element={<FeatsPage />} />
            <Route path="/rules" element={<RulesPage />} />

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

            <Route path="/tools/initiative" element={<InitiativeTrackerPage />} />
            <Route path="/tools/spell-slots" element={<SpellSlotsPage />} />
            <Route path="/tools/cr-budget" element={<CrBudgetPage />} />
            <Route path="/tools/loot" element={<LootPage />} />
            <Route path="/tools/names" element={<NameGeneratorPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
