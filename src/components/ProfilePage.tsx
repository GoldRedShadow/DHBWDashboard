import React from 'react';
import { motion } from 'motion/react';
import { User, Shield, Gift, Palette, Sparkles, CheckCircle2 } from 'lucide-react';
import { UserProfile, Prize } from '../types';
import { PRIZES } from '../lib/prizes';
import { db, doc, updateDoc } from '../firebase';
import { cn } from '../lib/utils';

interface ProfilePageProps {
  userProfile: UserProfile;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userProfile }) => {
  const inventory = userProfile.inventory || [];
  
  // Get unique prizes from inventory
  const wonPrizes = PRIZES.filter(p => inventory.includes(p.id));

  const activatePrize = async (prize: Prize) => {
    const userDoc = doc(db, 'users', userProfile.uid);
    if (prize.type === 'theme') {
      await updateDoc(userDoc, { activeTheme: prize.id });
    } else {
      await updateDoc(userDoc, { activeGimmick: prize.id });
    }
  };

  const deactivateGimmick = async () => {
    const userDoc = doc(db, 'users', userProfile.uid);
    await updateDoc(userDoc, { activeGimmick: '' });
  };

  const deactivateTheme = async () => {
    const userDoc = doc(db, 'users', userProfile.uid);
    await updateDoc(userDoc, { activeTheme: '' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      {/* User Header */}
      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
          <User size={48} />
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-3xl font-black text-gray-900">{userProfile.email}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              <Shield size={12} />
              {userProfile.role}
            </span>
            <span className="px-3 py-1 bg-primary-100 rounded-full text-xs font-bold text-primary-600 uppercase flex items-center gap-1">
              <Sparkles size={12} />
              {userProfile.tokens} Tokens
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Themes Section */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="text-primary-600" />
            Deine Themes
          </h3>
          <div className="space-y-3">
            <div 
              onClick={deactivateTheme}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                !userProfile.activeTheme ? "border-primary-600 bg-primary-50" : "border-gray-100 bg-white hover:border-gray-200"
              )}
            >
              <div>
                <p className="font-bold">Standard</p>
                <p className="text-xs text-gray-500">Das klassische UniDash Aussehen.</p>
              </div>
              {!userProfile.activeTheme && <CheckCircle2 className="text-primary-600" />}
            </div>
            {wonPrizes.filter(p => p.type === 'theme').map(prize => (
              <div 
                key={prize.id}
                onClick={() => activatePrize(prize)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                  userProfile.activeTheme === prize.id ? "border-primary-600 bg-primary-50" : "border-gray-100 bg-white hover:border-gray-200"
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{prize.name}</p>
                    <span className={cn(
                      "text-[10px] uppercase font-black px-2 py-0.5 rounded-full",
                      prize.rarity === 'legendary' ? "bg-yellow-100 text-yellow-600" :
                      prize.rarity === 'rare' ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    )}>
                      {prize.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{prize.description}</p>
                </div>
                {userProfile.activeTheme === prize.id && <CheckCircle2 className="text-primary-600" />}
              </div>
            ))}
            {wonPrizes.filter(p => p.type === 'theme').length === 0 && (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">Noch keine Themes gewonnen.</p>
              </div>
            )}
          </div>
        </section>

        {/* Gimmicks Section */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="text-primary-600" />
            Deine Gimmicks
          </h3>
          <div className="space-y-3">
            <div 
              onClick={deactivateGimmick}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                !userProfile.activeGimmick ? "border-primary-600 bg-primary-50" : "border-gray-100 bg-white hover:border-gray-200"
              )}
            >
              <div>
                <p className="font-bold">Kein Gimmick</p>
                <p className="text-xs text-gray-500">Deaktiviere alle Gimmicks.</p>
              </div>
              {!userProfile.activeGimmick && <CheckCircle2 className="text-primary-600" />}
            </div>
            {wonPrizes.filter(p => p.type === 'gimmick').map(prize => (
              <div 
                key={prize.id}
                onClick={() => activatePrize(prize)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                  userProfile.activeGimmick === prize.id ? "border-primary-600 bg-primary-50" : "border-gray-100 bg-white hover:border-gray-200"
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{prize.name}</p>
                    <span className={cn(
                      "text-[10px] uppercase font-black px-2 py-0.5 rounded-full",
                      prize.rarity === 'legendary' ? "bg-yellow-100 text-yellow-600" :
                      prize.rarity === 'rare' ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    )}>
                      {prize.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{prize.description}</p>
                </div>
                {userProfile.activeGimmick === prize.id && <CheckCircle2 className="text-primary-600" />}
              </div>
            ))}
            {wonPrizes.filter(p => p.type === 'gimmick').length === 0 && (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">Noch keine Gimmicks gewonnen.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

