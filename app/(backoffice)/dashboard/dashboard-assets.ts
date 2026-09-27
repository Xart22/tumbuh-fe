/**
 * Product imagery from Stitch design library (`lh3.googleusercontent.com/aida-public/*`).
 * Whitelisted in `next.config.ts`.
 */
export const TOP_PRODUCT_IMAGES: Record<string, { image: string; category: string }> = {
  aren: {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDJxMBVgEKhh00dO_eu0rXuJ2PqTycaYfUQSH-dE3o0NRX8n5AZZmUHUSgfFKmzCRhSPyN3_0CLPX3JCrU7odhSgu31C7hTUxGFCbZnTIO4kvPk2nDDVtbqbICcs7M7l5PSk_pN-VhrM0SqGitQD-Ly0Pi_K_pXNCE_lZHwpAWsBT8OLJ3GZ3bb9RkNZIa44TYlpZt-RQEG5CQB7MHKMtfUjY1dwjseHTAT68KR_XKS0Lb31DyK0Yipyw',
    category: 'Coffee • Signature Cold Drink',
  },
  croissant: {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ1NSWOx3a3ofWBq-vxY7mHsVZc01EC1wcCE41hHPumuowJObDrrkQ7H_xAjv05fJrIZ2qJBzPeNIMrJG96U6mXLmRkzwVOvXLvbGJH-4BvdaVCpbkPpZJSIy08-pqQP0B8P8s4oO7c7ZUyIXYAii5D2mh4Ti0ENbEtZkAl9IEUi9gHEiX7GvYK4nMrmqDPou9DCukIYSd777e9B8BlDoKNYoYJzpIky1ZPJGY1357TXSE4Y1YACpGug',
    category: 'Pastry • Baked Fresh 07:00',
  },
  matcha: {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDVi_LChlPU8bWd8W-kD5-4FBWsIIcG-hFBbb7ZN_vFXKHG_3yNrtCunU7fC5rQryuNGsmFMIEPRsfxbwXm1Obu3EZC2xA_Ue5r53yOgZ-64kYUFjKgXcJMoVPYTQ1ryjyj5g24ICv5ds0TKNlp1UOResz8zkd8djdR6RvxoXXv-41j9GUWjx_8CI9HyC3HSROxcgEgjUACKHcV6-DyUCDhUZSpuE_ZYP4gpaPC0M5s4lDS2ax5HlSXjA',
    category: 'Tea & Dairy-Free',
  },
  fries: {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBQG7j4xaWRf8FyyGyWogRexMVyvw62wsna6gggDn8lnZuaijxv8hISeCyGPeZgDu-kBgFLnFMjjZFE0C9ft5TDvDnODklIl8242x4-ePnQ9A07tdxH8J5OCt7_kraM9DtmvjnTGSZgpHJFFPWq0Pt68FxVI_5MlOCx3DumO41s_8jVB4GSZIrXUPFDUW3G4bJ1YrZ6FpcHbvvIUk6x_MtD76OkU5Da4WZPbywkJAB7Re3_aX3UuPZtJg',
    category: 'Snacks • Kitchen Station 2',
  },
  ayam: {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC1HpwQhYybT9fKaDM5jAXeghx0_b7bZx-aCk9-2HBh3Ii7R-5Ih1uchTP_w4MfW7FnBCfnUoSNlZz-cpKb4mPK5N4jCDU59tlQpcBUhqSQ1oPfZieexZum0kZgKLodKLqZid5bWRJKWNblfJdPaqrBfiBoLB2J641lWC7NN1KfIH9HMCbKxoVR_bk2YnxbXXWQlV0LuEbZPvlkJ5WBtekHWqTRcWB8bZvSPYL3dA0zlc2fDllMLEXBbw',
    category: 'Heavy Meal • Lunch Favorite',
  },
};

const DEFAULT_INDEX_IMAGES = [
  TOP_PRODUCT_IMAGES.aren,
  TOP_PRODUCT_IMAGES.croissant,
  TOP_PRODUCT_IMAGES.matcha,
  TOP_PRODUCT_IMAGES.fries,
  TOP_PRODUCT_IMAGES.ayam,
];

export function resolveProductVisual(name: string = '', index: number = 0) {
  const lower = name.toLowerCase();
  if (lower.includes('aren') || lower.includes('kopi') || lower.includes('coffee') || lower.includes('latte')) {
    return TOP_PRODUCT_IMAGES.aren;
  }
  if (lower.includes('croissant') || lower.includes('roti') || lower.includes('pastry') || lower.includes('bread')) {
    return TOP_PRODUCT_IMAGES.croissant;
  }
  if (lower.includes('matcha') || lower.includes('tea') || lower.includes('teh')) {
    return TOP_PRODUCT_IMAGES.matcha;
  }
  if (lower.includes('fries') || lower.includes('snack') || lower.includes('kentang')) {
    return TOP_PRODUCT_IMAGES.fries;
  }
  if (lower.includes('ayam') || lower.includes('nasi') || lower.includes('rice') || lower.includes('meal')) {
    return TOP_PRODUCT_IMAGES.ayam;
  }
  return DEFAULT_INDEX_IMAGES[index % DEFAULT_INDEX_IMAGES.length];
}
