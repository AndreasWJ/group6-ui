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
      recipes: { type: Object },
      favoriteIds: { type: Array },
      recipeSearch: { type: String },
      calories: { type: Number },
      excludedIngredients: { type: String },
    };
  }

  /* constructor() {
    super();
    this.configEntryId = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchConfigEntries();
  }

  fetchConfigEntries() {
    this.hass.callWS({ type: 'config_entries/get' })
      .then(entries => {
        console.log('Config Entries:', entries); const entry = entries.find(entry => entry.domain === 'mealie');
        const configEntryId = entry.entry_id;
        this.configEntryId = configEntryId;
      }).catch(error => { console.error('Error fetching config entries:', error); });
  }

  render() {
    console.log('configEntryId', this.configEntryId);
    if (!this.configEntryId) {
      return html`
        <wired-card elevation="2">
          <p>Loading</p>
        </wired-card>
      `;
    }

    // { return_response: true }
    this.hass.callService('mealie', 'get_recipes', { config_entry_id: this.configEntryId }).then((data) => {
      console.log('Get recipes', data);
      return html`
        <wired-card elevation="2">
          <p>There are ${Object.keys(this.hass.states).length} entities.</p>
          <p>The screen is${this.narrow ? "" : " not"} narrow.</p>
          Configured panel config
          <pre>${JSON.stringify(this.panel.config, undefined, 2)}</pre>
          Current route
          <pre>${JSON.stringify(this.route, undefined, 2)}</pre>
          <p>${JSON.stringify(Object.keys(this.hass.states))}</p>
        </wired-card>
      `;
    }).catch((error) => {
      return html`
        <wired-card elevation="2">
          <p>Could not fetch recipes</p>
        </wired-card>
      `;
    });
  } */

  constructor() {
    super();
    this.configEntryId = '';
    this.recipes = null;
    this.favoriteIds = [];
    this.recipeSearch = '';
    this.calories = null;
    this.excludedIngredients = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.setup();
  }

  async setup() {
    await this._fetchConfigEntries();
    await this._performAction();
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

  async _performAction() {
    if (!this.configEntryId) {
      console.error('Config Entry ID not found');
      return;
    } try {
      const response = await this.hass.callService('mealie', 'get_recipes', { config_entry_id: this.configEntryId }, undefined, undefined, true);
      console.log('Service call successful! Response:', response);
      this.recipes = response.response.recipes;
    } catch (error) {
      console.error('Service call failed:', error);
      this.recipes = null;
    }
  }

  async getFavorites() {
    if (!this.configEntryId) {
      console.error('Config Entry ID not found');
      return;
    } try {
      const response = await this.hass.callService('mealie', 'get_favourites', { config_entry_id: this.configEntryId }, undefined, undefined, true);
      console.log('Service call successful! Response:', response);
      this.favoriteIds = response.response.recipes;
    } catch (error) {
      console.error('Service call failed:', error);
      this.favoriteIds = null;
    }
  }

  async _addFavorite(recipeId) {
    console.log('Add favorite', recipeId);
    try {
      await this.hass.callService('mealie', 'heart_recipe', { config_entry_id: this.configEntryId, recipe_id: recipeId }, undefined, undefined, true);
      this.favoriteIds = [...this.favoriteIds, recipeId];
    } catch (error) {
      console.log('Could not add favorite', error);
    }
  }

  async _removeFavorite(recipeId) {
    console.log('Remove favorite', recipeId);
    try {
      await this.hass.callService('mealie', 'unheart_recipe', { config_entry_id: this.configEntryId, recipe_id: recipeId }, undefined, undefined, true);
      this.favoriteIds = this.favoriteIds.filter((f) => f !== recipeId);
    } catch (error) {
      console.log('Could not remove favorite', error);
    }
  }

  async onChange(e) {
    console.log('recipeSearch', e.target.value);
    // update the property so that it keeps up with the input's current value
    this.recipeSearch = e.target.value;
    this.calories = null;

    if (!this.configEntryId) {
      console.error('Config Entry ID not found');
      return;
    } try {
      const response = await this.hass.callService('mealie', 'get_specific_recipes', { config_entry_id: this.configEntryId, recipe_name: e.target.value }, undefined, undefined, true);
      console.log('Service call successful! Response:', response);
      this.recipes = response.response.recipes;
    } catch (error) {
      console.error('Service call failed:', error);
      this.recipes = null;
    }
  }

  async onCaloriesChange(e) {
    const updated = Number.parseInt(e.target.value) || 5000;
    this.calories = updated;
    this.recipeSearch = '';

    if (!this.configEntryId) {
      console.error('Config Entry ID not found');
      return;
    } try {
      const response = await this.hass.callService('mealie', 'get_calories_based_filtered_recipes', { config_entry_id: this.configEntryId, max_calories: updated }, undefined, undefined, true);
      console.log('Service call successful! Response:', response);
      this.recipes = response.response.recipes;
    } catch (error) {
      console.error('Service call failed:', error);
      this.recipes = null;
    }
  }

  async onCaloriesChange(e) {
    const updated = Number.parseInt(e.target.value) || 5000;
    this.calories = updated;
    this.recipeSearch = '';

    if (!this.configEntryId) {
      console.error('Config Entry ID not found');
      return;
    } try {
      const response = await this.hass.callService('mealie', 'get_calories_based_filtered_recipes', { config_entry_id: this.configEntryId, max_calories: updated }, undefined, undefined, true);
      console.log('Service call successful! Response:', response);
      this.recipes = response.response.recipes;
    } catch (error) {
      console.error('Service call failed:', error);
      this.recipes = null;
    }
  }

  async onExcludedChange(e) {
    this.excludedIngredients = e.target.value;
    const excluded = e.target.value.split(',').filter((ingredient) => ingredient !== '');
    console.log('excluded', excluded);

    if (!this.configEntryId) {
      console.error('Config Entry ID not found');
      return;
    } try {
      const response = await this.hass.callService('mealie', 'get_filtered_recipes_by_ingredients', { config_entry_id: this.configEntryId, excluded_ingredients: excluded }, undefined, undefined, true);
      console.log('Service call successful! Response:', response);
      this.recipes = response.response.recipes;
    } catch (error) {
      console.error('Service call failed:', error);
      this.recipes = null;
    }
  }

  /* render() {
    return html`
      <wired-card elevation="2">
        <p>Config Entry ID: ${this.configEntryId}</p>
        <p>There are ${Object.keys(this.hass.states).length} entities.</p>
        <p>The screen is${this.narrow ? "" : " not"} narrow.</p>
        <button @click="${this._performAction}">Perform Action</button>
        <pre>${JSON.stringify(this.panel.config, undefined, 2)}</pre>
        <pre>${JSON.stringify(this.route, undefined, 2)}</pre>
        <p>${JSON.stringify(Object.keys(this.hass))}</p>
        <p>${JSON.stringify(Object.keys(this.hass.services.mealie))}</p>
        <p>${typeof this.hass.services.mealie.get_recipes}</p>
        <p>${JSON.stringify(this.hass.services.mealie.get_recipes)}</p>
        <p>${this.hass.callService.toString()}</p>
      </wired-card>
      <div class="response-content">
        ${this.recipes ? html`<p>Recipes: ${JSON.stringify(this.recipes)}</p>` : html`<p>Could not fetch recipes</p>`}
      </div>
    `;
  } */

  render() {
    console.log('render with favoriteIds', this.favoriteIds);
    return html`
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="display: flex;">
          <button @click="${this._performAction}">Perform Action</button>
          <input type="text" placeholder="Recipe name" value="${this.recipeSearch}" @input=${this.onChange} />
          <input type="number" min="100" max="5000" placeholder="Calories" value="${this.calories}" @input=${this.onCaloriesChange} />
          <input type="text" placeholder="Excluded ingredients(comma separated)" value="${this.excludedIngredients}" @input=${this.onExcludedChange} />
        </div>
        <div class="container">
          ${this.recipes ?
        html`${this.recipes.map((recipe) => {
          return html`
            <div class="card">
              <div style="width: 100%; display: flex; justify-content: end;">
                ${this.favoriteIds.includes(recipe.recipe_id) ?
              html`
                <div @click="${() => this._removeFavorite(recipe.recipe_id)}" style="cursor: pointer;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                    <path fill="currentColor" d="m12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53z"/>
                  </svg>
                </div>
              `: html`
                <div @click="${() => this._addFavorite(recipe.recipe_id)}" style="cursor: pointer;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                    <path fill="currentColor" d="m12.1 18.55l-.1.1l-.11-.1C7.14 14.24 4 11.39 4 8.5C4 6.5 5.5 5 7.5 5c1.54 0 3.04 1 3.57 2.36h1.86C13.46 6 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5c0 2.89-3.14 5.74-7.9 10.05M16.5 3c-1.74 0-3.41.81-4.5 2.08C10.91 3.81 9.24 3 7.5 3C4.42 3 2 5.41 2 8.5c0 3.77 3.4 6.86 8.55 11.53L12 21.35l1.45-1.32C18.6 15.36 22 12.27 22 8.5C22 5.41 19.58 3 16.5 3"/>
                  </svg>
                </div>
              `}
              </div>
              <h2>${recipe.name}</h2>
              <span style="font-size: 12px;">${recipe.recipe_id}</span>
            </div>
          `
        })}` :
        html`<p>Could not fetch recipes</p>`}
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        background-color: #fafafa;
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
customElements.define("recipe-panel-71", RecipePanel);
