        const HTTPS_PATTERN = /^https:\/\//i;
        const LOCAL_PATTERN = /(localhost|127\.0\.0\.1)/i;

        const normalize = (value) => (value ? value.trim().replace(/\/$/, "") : null);

        const splitCandidates = (value) =>
            value
                ? value
                        .split(",")
                        .map(normalize)
                        .filter(Boolean)
                : [];

        const collectOrigins = () =>
            [
                process.env.API_PUBLIC_URL,
                process.env.REMOTE_ORIGIN,
                process.env.FRONTEND_ORIGIN,
                process.env.PUBLIC_ORIGIN,
                process.env.PUBLIC_DNS ? `https://${process.env.PUBLIC_DNS}` : null,
                process.env.PUBLIC_IP ? `https://${process.env.PUBLIC_IP}` : null,
            ].flatMap(splitCandidates);

        let cachedRequirement = null;

        const detectCrossSiteRequirement = () =>
            collectOrigins().some(
                (origin) => HTTPS_PATTERN.test(origin) && !LOCAL_PATTERN.test(origin)
            );

        const ensureCrossSiteRequirement = () => {
            if (cachedRequirement === null) {
                cachedRequirement = detectCrossSiteRequirement();
            }
            return cachedRequirement;
        };

        export function resetCookieConfigCache() {
            cachedRequirement = null;
        }

        export function getCookieSecurityOptions() {
            const isProd = process.env.NODE_ENV === "production";
            const crossSite = ensureCrossSiteRequirement();
            const secure = crossSite || isProd;
            const sameSite = crossSite ? "none" : "lax";
            const domain = crossSite ? ".ruouongtu.me" : undefined;
            return { secure, sameSite, domain };
        }

        export function shouldTrustProxy() {
            return (
                ensureCrossSiteRequirement() ||
                process.env.NODE_ENV === "production" ||
                process.env.TRUST_PROXY === "true"
            );  
        }

        export function isCrossSiteCookieRequired() {
            return ensureCrossSiteRequirement();
        }
