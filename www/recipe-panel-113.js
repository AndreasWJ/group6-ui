import "https://unpkg.com/wired-card@2.1.0/lib/wired-card.js?module";
import {
    LitElement,
    html,
    css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class RecipePanel extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            narrow: { type: Boolean },
            route: { type: Object },
            panel: { type: Object },
            // configEntryId: { type: String },
            configEntryId: { type: String },
            recipeId: { type: String },
            recipe: { type: Object },
            calories: { type: Number },
            favoriteIds: { type: Array },
        };
    }

    constructor() {
        super();
        this.configEntryId = '';
        this.recipeId = null;
        this.recipe = null;
        this.calories = null;
        this.favoriteIds = [];
    }

    connectedCallback() {
        super.connectedCallback();
        const path = window.location.pathname;
        const parts = path.split('/');
        const id = parts[parts.length - 1]; // Assuming 'id' is the last part
        if (id === 'recipe') {
            this.recipeId = null;
        } else {
            console.log('Recipe id from url', id);
            this.recipeId = id;
        }

        this.setup();
    }

    async setup() {
        await this._fetchConfigEntries();
        await this.getRecipe();
        await this.getFavorites();
    }

    async _fetchConfigEntries() {
        try {
            const entries = await this.hass.callWS({ type: 'config_entries/get' });
            console.log('Config Entries:', entries);
            const entry = entries.find(entry => entry.domain === 'mealie');
            if (entry) {
                this.configEntryId = entry.entry_id;
            }
        } catch (error) {
            console.error('Error fetching config entries:', error);
        }
    }

    async sendRequest(actionName, data, mapFn) {
        if (!data.config_entry_id) {
            console.error('Config Entry ID not found');
            return;
        }

        const response = await this.hass.callService('mealie', actionName, data, undefined, undefined, true);
        console.log('Service call successful! Response:', response);
        return mapFn ? mapFn(response) : response;
    }

    async getRecipe() {
        if (!this.recipeId) {
            return;
        }

        try {
            this.recipe = await this.sendRequest('get_recipe', { config_entry_id: this.configEntryId, recipe_id: this.recipeId }, (response) => response.response.recipe);
            console.log('Fetched recipe', this.recipe);

            const calories = await this.sendRequest('get_recipe_calories', { config_entry_id: this.configEntryId, recipe_slug: this.recipeId }, (response) => response.response.calories);
            this.calories = Number.parseInt(calories);
            console.log('Fetched calories for recipe', this.calories);
        } catch (error) {
            console.error('Service call failed:', error);
            this.recipe = null;
        }

        // With new recipes fetch all attached recipes
        // These are recommended recipes
        // await this.getAttachedRecipes();
    }

    async getFavorites() {
        try {
            this.favoriteIds = await this.sendRequest('get_favourites', { config_entry_id: this.configEntryId }, (response) => response.response.recipes);
        } catch (error) {
            console.error('Service call failed:', error);
            this.favoriteIds = null;
        }
    }

    async _addFavorite(recipeId) {
        console.log('Add favorite', recipeId);
        try {
            await this.sendRequest('heart_recipe', { config_entry_id: this.configEntryId, recipe_id: recipeId });
            this.favoriteIds = [...this.favoriteIds, recipeId];
        } catch (error) {
            console.log('Could not add favorite', error);
        }
    }

    async _removeFavorite(recipeId) {
        console.log('Remove favorite', recipeId);
        try {
            await this.sendRequest('unheart_recipe', { config_entry_id: this.configEntryId, recipe_id: recipeId });
            this.favoriteIds = this.favoriteIds.filter((f) => f !== recipeId);
        } catch (error) {
            console.log('Could not remove favorite', error);
        }
    }

    render() {
        if (this.recipeId === null) {
            return html`
                <div style="max-width: 800px; margin: 0 auto;">
                    <p>You have to specify recipe id in the url.</p>
                </div>
            `;
        }

        if (this.recipe === null) {
            return html`
                <div style="max-width: 800px; margin: 0 auto;">
                    <p>Fetching recipe.</p>
                </div>
            `;
        }

        return html`
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center">
                    <div style="display: flex; gap: 0.5rem">
                        <h1>${this.recipe.name}</h1>
                        <a href="${this.recipe.original_url}" title="Original url" style="display: flex; align-items: center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 24 24" style="color: #ffffff">
                                <path fill="currentColor" d="M10.59,13.41C11,13.8 11,14.44 10.59,14.83C10.2,15.22 9.56,15.22 9.17,14.83C7.22,12.88 7.22,9.71 9.17,7.76V7.76L12.71,4.22C14.66,2.27 17.83,2.27 19.78,4.22C21.73,6.17 21.73,9.34 19.78,11.29L18.29,12.78C18.3,11.96 18.17,11.14 17.89,10.36L18.36,9.88C19.54,8.71 19.54,6.81 18.36,5.64C17.19,4.46 15.29,4.46 14.12,5.64L10.59,9.17C9.41,10.34 9.41,12.24 10.59,13.41M13.41,9.17C13.8,8.78 14.44,8.78 14.83,9.17C16.78,11.12 16.78,14.29 14.83,16.24V16.24L11.29,19.78C9.34,21.73 6.17,21.73 4.22,19.78C2.27,17.83 2.27,14.66 4.22,12.71L5.71,11.22C5.7,12.04 5.83,12.86 6.11,13.65L5.64,14.12C4.46,15.29 4.46,17.19 5.64,18.36C6.81,19.54 8.71,19.54 9.88,18.36L13.41,14.83C14.59,13.66 14.59,11.76 13.41,10.59C13,10.2 13,9.56 13.41,9.17Z" />
                            </svg>
                        </a>
                    </div>

                    ${this.favoriteIds.includes(this.recipeId) ?
                html`
                            <div @click="${() => this._removeFavorite(this.recipeId)}" style="cursor: pointer;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24">
                                <path fill="currentColor" d="m12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53z"/>
                                </svg>
                            </div>
                        `: html`
                            <div @click="${() => this._addFavorite(this.recipeId)}" style="cursor: pointer;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24">
                                <path fill="currentColor" d="m12.1 18.55l-.1.1l-.11-.1C7.14 14.24 4 11.39 4 8.5C4 6.5 5.5 5 7.5 5c1.54 0 3.04 1 3.57 2.36h1.86C13.46 6 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5c0 2.89-3.14 5.74-7.9 10.05M16.5 3c-1.74 0-3.41.81-4.5 2.08C10.91 3.81 9.24 3 7.5 3C4.42 3 2 5.41 2 8.5c0 3.77 3.4 6.86 8.55 11.53L12 21.35l1.45-1.32C18.6 15.36 22 12.27 22 8.5C22 5.41 19.58 3 16.5 3"/>
                                </svg>
                            </div>
                        `
            }
                </div>
                <p>Calories: ${this.calories}</p>
                <p>${this.recipe.description}</p>

                <h1>Ingredients</h1>
                <ul>
                    ${this.recipe.ingredients.map((ingredient) => {
                return html`
                            <li>
                                ${ingredient.quantity}
                                ${ingredient.note}
                            </li>
                        `;
            })}
                </ul>

                <h1>Instructions</h1>
                <ul>
                    ${this.recipe.instructions.map((instruction) => {
                return html`
                            <li>${instruction.text}</li>
                        `;
            })}
                </ul>
            </div>
        `;
    }

    static get styles() {
        return css`
      :host {
        background-color: #111111;
        padding: 16px;
        display: block;
      }
      .container {
        padding: 16px;
        font-size: 18px;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: 2em;
      }
      .card {
        display: flex;
        flex-direction: column;
        gap: 1em;
        padding: 2em;
        background-color: #151718;
        border-style: solid;
        border-width: 1px;
        border-color: #e0e0e0;
        border-radius: 12px;
      }
    `;
    }
}
customElements.define("recipe-panel-113", RecipePanel);
