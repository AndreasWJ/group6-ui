import "https://unpkg.com/wired-card@2.1.0/lib/wired-card.js?module";
import {
    LitElement,
    html,
    css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class IngredientsPanel extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            narrow: { type: Boolean },
            route: { type: Object },
            panel: { type: Object },
            configEntryId: { type: String },
            ingredients: { type: Array },
            newIngredient: { type: String },
        };
    }

    constructor() {
        super();
        this.configEntryId = '';
        this.ingredients = [];
        this.newIngredient = '';
    }

    connectedCallback() {
        super.connectedCallback();
        this.setup();
    }

    async setup() {
        await this._fetchConfigEntries();
        await this.getIngredients();
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

    async getIngredients() {
        if (!this.configEntryId) {
            console.error('Config Entry ID not found');
            return;
        } try {
            const response = await this.hass.callService('mealie', 'get_all_available_ingredients', { config_entry_id: this.configEntryId }, undefined, undefined, true);
            console.log('Service call successful! Response:', response);
            this.ingredients = response.response.items.map((data) => data.item);
        } catch (error) {
            console.error('Service call failed:', error);
            this.ingredients = [];
        }
    }

    async onRemoveIngredient(ingredient) {
        if (!this.configEntryId) {
            console.error('Config Entry ID not found');
            return;
        } try {
            await this.hass.callService('mealie', 'remove_ingredient', { config_entry_id: this.configEntryId, remove_ingredient: ingredient }, undefined, undefined, true);
            await this.getIngredients();
        } catch (error) {
            console.error('Service call failed:', error);
        }
    }

    onNewIngredient(e) {
        this.newIngredient = e.target.value;
    }

    async createIngredient() {
        if (!this.configEntryId) {
            console.error('Config Entry ID not found');
            return;
        }

        if (!this.newIngredient) {
            return;
        }

        try {
            await this.hass.callService('mealie', 'enter_new_ingredient', { config_entry_id: this.configEntryId, add_ingredient: this.newIngredient }, undefined, undefined, true);
            await this.getIngredients();
        } catch (error) {
            console.error('Service call failed:', error);
        }

        // Reset ingredient text field
        const elem = this.shadowRoot.getElementById('ingredient-text');
        elem.value = '';
    }

    render() {
        return html`
      <div style="max-width: 800px; margin: 0 auto;">
        <h1>Ingredients</h1>
        <input
            type="text"
            id="ingredient-text"
            name="ingredient-text"
            placeholder="Soy"
            value="${this.newIngredient}"
            @input=${this.onNewIngredient}
        />
        <button @click="${this.createIngredient}">Create</button>
        <ul>
            ${this.ingredients.map((ingredient) => html`
                <li>
                    ${ingredient}
                    <button title="Remove ingredient" @click="${() => this.onRemoveIngredient(ingredient)}" style="cursor: pointer">
                        <svg style="width: 16px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>close</title><path fill="#fafafa" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>
                    </button>
                </li>
            `)}
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
customElements.define("ingredients-panel-15", IngredientsPanel);
