// NEXT_PUBLIC_ROOT_URL is the bot server, inlined into the client at build time: the ticket redeem
// call, the socket and the CSP's connect-src all come from it. A production build without it would
// build cleanly and then fail every launch, so refuse to build. Checked from the webpack hook of a
// production compile, which only `next build` runs (`next lint` loads this config too).
const requireBotServerUrl = () => {
    const url = process.env.NEXT_PUBLIC_ROOT_URL;
    let valid = false;
    try {
        valid = !!url && ['http:', 'https:'].includes(new URL(url).protocol);
    } catch {
        valid = false;
    }
    if (!valid) {
        throw new Error(
            'NEXT_PUBLIC_ROOT_URL must be set to the bot server\'s http(s) origin for a production build ' +
            `(got ${url === undefined ? 'nothing' : JSON.stringify(url)}).`
        );
    }
};

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['karabast-data.s3.amazonaws.com'],
    },
    eslint: {
        // TODO: re-enable linting if we can get vscode to do auto-fixes like with the BE repo setup
        ignoreDuringBuilds: true,
    },
    webpack(config, { dev }) {
        if (!dev) {
            requireBotServerUrl();
        }
        // Add SVGR loader for importing SVGs as React components
        config.module.rules.push({
            test: /\.svg$/,
            use: [
                {
                    loader: '@svgr/webpack',
                    options: {
                        svgoConfig: {
                            plugins: [
                                {
                                    name: 'removeStyleElement',
                                },
                                {
                                    name: 'removeAttrs',
                                    params: {
                                        attrs: 'class',
                                    },
                                },
                                {
                                    name: 'addAttributesToSVGElement',
                                    params: {
                                        attributes: [{ fill: 'currentColor' }],
                                    },
                                },
                            ],
                        },
                    },
                },
            ],
        });
        return config;
    },
};

export default nextConfig;
