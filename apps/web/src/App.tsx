import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuthStore } from '@/store/auth';

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const SpellsPage = lazy(() => import('@/pages/SpellsPage').then((m) => ({ default: m.SpellsPage })));
const SpellDetailPage = lazy(() => import('@/pages/SpellDetailPage').then((m) => ({ default: m.SpellDetailPage })));
const BestiaryPage = lazy(() => import('@/pages/BestiaryPage').then((m) => ({ default: m.BestiaryPage })));
const MonsterDetailPage = lazy(() => import('@/pages/MonsterDetailPage').then((m) => ({ default: m.MonsterDetailPage })));
const CharactersPage = lazy(() => import('@/pages/CharactersPage').then((m) => ({ default: m.CharactersPage })));
const CharacterBuilderPage = lazy(() => import('@/pages/CharacterBuilderPage').then((m) => ({ default: m.CharacterBuilderPage })));
const CharacterSheetPage = lazy(() => import('@/pages/CharacterSheetPage').then((m) => ({ default: m.CharacterSheetPage })));
const CampaignsPage = lazy(() => import('@/pages/CampaignsPage').then((m) => ({ default: m.CampaignsPage })));
const CampaignBuilderPage = lazy(() => import('@/pages/CampaignBuilderPage').then((m) => ({ default: m.CampaignBuilderPage })));
const CampaignDetailPage = lazy(() => import('@/pages/CampaignDetailPage').then((m) => ({ default: m.CampaignDetailPage })));
const EncounterBuilderPage = lazy(() => import('@/pages/EncounterBuilderPage').then((m) => ({ default: m.EncounterBuilderPage })));
const DiceRollerPage = lazy(() => import('@/pages/DiceRollerPage').then((m) => ({ default: m.DiceRollerPage })));
const MapsPage = lazy(() => import('@/pages/MapsPage').then((m) => ({ default: m.MapsPage })));
const MapUploaderPage = lazy(() => import('@/pages/MapUploaderPage').then((m) => ({ default: m.MapUploaderPage })));
const MapDetailPage = lazy(() => import('@/pages/MapDetailPage').then((m) => ({ default: m.MapDetailPage })));
const HomebrewPage = lazy(() => import('@/pages/HomebrewPage').then((m) => ({ default: m.HomebrewPage })));
const HomebrewBuilderPage = lazy(() => import('@/pages/HomebrewBuilderPage').then((m) => ({ default: m.HomebrewBuilderPage })));
const HomebrewDetailPage = lazy(() => import('@/pages/HomebrewDetailPage').then((m) => ({ default: m.HomebrewDetailPage })));
const AiPage = lazy(() => import('@/pages/AiPage').then((m) => ({ default: m.AiPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));

const RacesPage = lazy(() => import('@/pages/RacesPage').then((m) => ({ default: m.RacesPage })));
const RaceDetailPage = lazy(() => import('@/pages/RaceDetailPage').then((m) => ({ default: m.RaceDetailPage })));
const ClassesPage = lazy(() => import('@/pages/ClassesPage').then((m) => ({ default: m.ClassesPage })));
const ClassDetailPage = lazy(() => import('@/pages/ClassDetailPage').then((m) => ({ default: m.ClassDetailPage })));
const BackgroundsPage = lazy(() => import('@/pages/BackgroundsPage').then((m) => ({ default: m.BackgroundsPage })));
const ConditionsPage = lazy(() => import('@/pages/ConditionsPage').then((m) => ({ default: m.ConditionsPage })));
const EquipmentPage = lazy(() => import('@/pages/EquipmentPage').then((m) => ({ default: m.EquipmentPage })));
const MagicItemsPage = lazy(() => import('@/pages/MagicItemsPage').then((m) => ({ default: m.MagicItemsPage })));
const FeatsPage = lazy(() => import('@/pages/FeatsPage').then((m) => ({ default: m.FeatsPage })));
const FeatDetailPage = lazy(() => import('@/pages/FeatDetailPage').then((m) => ({ default: m.FeatDetailPage })));
const RulesPage = lazy(() => import('@/pages/RulesPage').then((m) => ({ default: m.RulesPage })));

const InitiativeTrackerPage = lazy(() => import('@/pages/tools/InitiativeTrackerPage').then((m) => ({ default: m.InitiativeTrackerPage })));
const SpellSlotsPage = lazy(() => import('@/pages/tools/SpellSlotsPage').then((m) => ({ default: m.SpellSlotsPage })));
const CrBudgetPage = lazy(() => import('@/pages/tools/CrBudgetPage').then((m) => ({ default: m.CrBudgetPage })));
const LootPage = lazy(() => import('@/pages/tools/LootPage').then((m) => ({ default: m.LootPage })));
const NameGeneratorPage = lazy(() => import('@/pages/tools/NameGeneratorPage').then((m) => ({ default: m.NameGeneratorPage })));

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px] h-full">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
    </div>
  );
}

export default function App() {
  const { user } = useAuthStore();

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuthStore();
    const token = localStorage.getItem('auth_token');
    const isActuallyLoading = isLoading || (!user && token);
    
    if (isActuallyLoading) return <PageLoader />;
    if (!user) return <Navigate to="/login" />;
    return <>{children}</>;
  };

  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuthStore();
    const token = localStorage.getItem('auth_token');
    const isActuallyLoading = isLoading || (!user && token);
    
    if (isActuallyLoading) return <PageLoader />;
    if (user?.role !== 'admin') return <Navigate to="/" />;
    return <>{children}</>;
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />

          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />

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
            <Route path="/feats/:id" element={<FeatDetailPage />} />
            <Route path="/rules" element={<RulesPage />} />

            <Route path="/characters" element={<CharactersPage />} />
            <Route path="/characters/new" element={<CharacterBuilderPage />} />
            <Route path="/characters/:id" element={<CharacterSheetPage />} />
            <Route path="/characters/:id/edit" element={<CharacterBuilderPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/campaigns/new" element={<CampaignBuilderPage />} />
            <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
            <Route path="/campaigns/:id/edit" element={<CampaignBuilderPage />} />
            <Route path="/encounters" element={<EncounterBuilderPage />} />
            <Route path="/dice" element={<DiceRollerPage />} />
            <Route path="/maps" element={<MapsPage />} />
            <Route path="/maps/new" element={<MapUploaderPage />} />
            <Route path="/maps/:id" element={<MapDetailPage />} />
            <Route path="/homebrew" element={<HomebrewPage />} />
            <Route path="/homebrew/new" element={<HomebrewBuilderPage />} />
            <Route path="/homebrew/:id" element={<HomebrewDetailPage />} />
            <Route path="/homebrew/:id/edit" element={<HomebrewBuilderPage />} />
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