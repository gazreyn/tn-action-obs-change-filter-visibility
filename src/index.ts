import { PropType, AutomationCard, ws } from '@tnotifier/runtime';
import type { PropList, WS } from '@tnotifier/runtime';
import { Props, SceneList } from './types';

export default class extends AutomationCard.Action()<Props> {
    ws: WS;

    async mounted(): Promise<void> {
        const { id } = this.identity;

        this.ws = await ws(id);

        await super.mounted();
    }

    async run() {
        this.setFilterVisibiliy(
            this.props.source,
            this.props.filter,
            this.props.action
        );
    }

    async prepareProps(staged): Promise<PropList> {

        /* Scene */
        let defaultScene = '';
        const fetch: SceneList = await this.ws.send('GetSceneList');
        const scenes = fetch.scenes.reduce((obj: any, scene) => {
            obj[scene.name] = {
                text: scene.name,
            };

            if (!defaultScene.length) {
                defaultScene = scene.name;
            }

            return obj;
        }, {});
        
        /* Source */
        let sources = {};
        let defaultSource = '';

        if(staged.scene) {
            const selectedScene = fetch.scenes.find((scene) => {
                return scene.name === staged.scene;
            });

            sources = selectedScene.sources.reduce<any>((obj, source) => {
                obj[source.name] = {
                    text: source.name
                };

                if(!defaultSource.length) {
                    defaultSource = source.name;
                }

            }, {});
        }

        /* Filters */
        let filters = {};
        let defaultFilter = '';

        if(staged.source) {
            const fetch = await this.ws.send('GetSourceFilters', {
                'source-name': staged.source
            });
            filters = fetch.filters.reduce((obj, filter) => {
                obj[filter.name] = {
                    text: filter.name
                };

                if(!defaultFilter.length) {
                    defaultFilter = filter.name;
                }
            }, {});
        }

        
        /* FINAL PROPERTIES */
        return {
            scene: {
                type: PropType.Select,
                label: 'Scene',
                default: defaultScene,
                options: scenes,
            },
            ...(staged.scene ? {
                source: {
                    type: PropType.Select,
                    default: defaultSource,
                    required: true,
                    label: 'Source',
                    help: 'Select a source',
                    options: sources
                }
            } : {}),
            ...(staged.source ? {
                filter: {
                    type: PropType.Select,
                    default: defaultFilter,
                    required: true,
                    label: 'Filter',
                    help: 'Select a filter',
                    options: filters
                },
                action: {
                    type: PropType.Select,
                    default: 'toggle',
                    required: true,
                    label: 'Action',
                    help: 'Select if you want to show the filter or not.',
                    options: {
                        toggle: { text: 'Toggle', icon: 'sync' },
                        hide: { text: 'Hide', icon: 'visibility_off' },
                        show: { text: 'Show', icon: 'visibility_on' },
                    }
                }
            } : {}),
        };
    }

    public async setFilterVisibiliy(source: string, filter: string, action = 'toggle'): Promise<void> {
        if(action === 'toggle') {
            const state = (await this.ws.send('GetSourceFilterInfo', {
                'source-name': this.props.source,
                'filter-name': this.props.filter
            })).enabled;

            this.setFilterVisibiliy(source, filter, (state ? 'hide' : 'show'));
        }
        
        this.ws.send('SetSourceFilterVisibility', {
            'source-name': this.props.source,
            'filter-name': this.props.filter,
            'filter-enabled': (action === 'show' ? true : false)
        });
    }
}
