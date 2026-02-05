import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Monitor, 
  Check, 
  Baby, 
  Chrome,
  Cast,
  Smartphone,
  AlertTriangle
} from "lucide-react";

export default function BetaTrial() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Users className="w-4 h-4" />
            First trial oversubscribed - apply below for the next one
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Join the <span className="text-teal-400">KidSafeTV</span> Beta
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
            Take part in the TV Tantrum streaming app trial and help shape the future of safer entertainment.
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Check className="w-5 h-5 text-teal-400" />
            Before You Apply
          </h2>
          
          <div className="grid gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Monitor className="w-6 h-6 text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-4">Technical Requirements</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Chrome className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-white">
                            You can use <span className="font-semibold text-amber-400">Chrome</span> and have a <span className="font-semibold text-amber-400">Google account</span>
                          </p>
                          <p className="text-slate-400 text-sm mt-1">
                            The app currently runs in a web browser.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Cast className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-white">
                            If casting to a TV, ensure your TV supports <span className="font-semibold text-amber-400">Chromecast</span>
                          </p>
                          <p className="text-slate-400 text-sm mt-1">
                            To check: open a browser on your tablet or computer, go to youtube.com, play a regular video (not a Short), and confirm the <strong>Chromecast</strong> button appears and works.
                          </p>
                          <p className="text-amber-400/80 text-sm mt-2">
                            Note: <strong>AirPlay</strong> is NOT recommended because it will pause between videos
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-white">
                            If using a tablet, you can <span className="font-semibold text-amber-400">disable the touch screen</span>
                          </p>
                          <p className="text-slate-400 text-sm mt-1">
                            This helps prevent accidental taps that navigate away during a session.
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-4">Good to Know</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Baby className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-white">
                            Our library is tailored for children <span className="font-semibold text-amber-400">7 and under</span>
                          </p>
                          <p className="text-slate-400 text-sm mt-1">
                            This trial is not recommended for children who are likely to navigate away if left unattended.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-white">
                            The beta may have <span className="font-semibold text-amber-400">bugs or interruptions</span>
                          </p>
                          <p className="text-slate-400 text-sm mt-1">
                            We'll be updating and fixing issues throughout the trial.
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Submit below to apply
          </h2>
          <p className="text-slate-400 text-center mb-8">
            You will receive an email when the next trial is ready. All participants will be awarded a 60% LIFETIME discount for their contribution to the creation of this service.
          </p>
          
          <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
            <CardContent className="p-0">
              <iframe
                src="https://www.uschooler.com/widget/form/Jm6Sjjb9OfD7zWEBE1LR"
                style={{ width: '100%', height: '700px', border: 'none', borderRadius: '3px' }}
                id="inline-Jm6Sjjb9OfD7zWEBE1LR"
                data-layout="{'id':'INLINE'}"
                data-trigger-type="alwaysShow"
                data-trigger-value=""
                data-activation-type="alwaysActivated"
                data-activation-value=""
                data-deactivation-type="neverDeactivate"
                data-deactivation-value=""
                data-form-name="kidsafetv beta application"
                data-height="700"
                data-layout-iframe-id="inline-Jm6Sjjb9OfD7zWEBE1LR"
                data-form-id="Jm6Sjjb9OfD7zWEBE1LR"
                title="kidsafetv beta application"
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      <script src="https://www.uschooler.com/js/form_embed.js" />
    </div>
  );
}
