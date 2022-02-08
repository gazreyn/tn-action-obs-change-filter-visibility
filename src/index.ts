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
        const fetch: SceneList = await this.ws.send('GetSceneList');
        const scenes = fetch.scenes.reduce((obj: any, scene) => {
            obj[scene.name] = {
                text: scene.name,
            };

            return obj;
        }, {});
        
        /* Source */
        let sources = {};

        if(staged.scene) {
            const selectedScene = fetch.scenes.find((scene) => {
                return scene.name === staged.scene;
            });

            sources = selectedScene.sources.reduce<any>((obj, source) => {
                obj[source.name] = {
                    text: source.name
                };

                return obj;
            }, {});
        }

        /* Filters */
        let filters = {};

        if(staged.source) {
            const fetch = await this.ws.send('GetSourceFilters', {
                'sourceName': staged.source
            });

            filters = fetch.filters.reduce((obj, filter) => {
                obj[filter.name] = {
                    text: filter.name
                };

                return obj;
            }, {});

        }

        
        /* FINAL PROPERTIES */
        return {
            scene: {
                type: PropType.Select,
                label: 'Scene',
                options: scenes,
                watch: true
            },
            ...(staged.scene ? {
                source: {
                    type: PropType.Select,
                    required: true,
                    label: 'Source',
                    help: 'Make sure the source has a filter',
                    options: sources,
                    watch: true
                },
            } : {}),
            ...(staged.source && Object.keys(filters).length > 0 ? {
                filter: {
                    type: PropType.Select,
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
            const fetch = await this.ws.send('GetSourceFilterInfo', {
                'sourceName': this.props.source,
                'filterName': this.props.filter
            });

            console.log("Raw value from fetch");
            console.log(fetch);
            
            const isEnabled = fetch.enabled;

            console.log('State should be: ');
            console.log(isEnabled);

            this.setFilterVisibiliy(source, filter, (isEnabled ? 'hide' : 'show'));
        }
        
        this.ws.send('SetSourceFilterVisibility', {
            'sourceName': this.props.source,
            'filterName': this.props.filter,
            'filterEnabled': (action === 'show' ? true : false)
        });
    } 
}
