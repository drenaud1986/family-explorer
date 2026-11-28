// Outil de découpe d'images (icône, badges) — utilisé par tools/decoupe.ps1
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public static class ImageTool
{
    public static Bitmap Load(string path) { using (var b = new Bitmap(path)) return new Bitmap(b); }

    public static Bitmap Crop(Bitmap src, int x, int y, int w, int h)
    {
        var dst = new Bitmap(w, h, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(dst)) g.DrawImage(src, new Rectangle(0, 0, w, h), new Rectangle(x, y, w, h), GraphicsUnit.Pixel);
        return dst;
    }

    // Rend transparents les pixels proches de la couleur de fond, en partant des bords (remplissage)
    public static void FloodTransparent(Bitmap bmp, int tol)
    {
        int w = bmp.Width, h = bmp.Height;
        var data = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        var px = new int[w * h];
        System.Runtime.InteropServices.Marshal.Copy(data.Scan0, px, 0, px.Length);
        // couleur de fond = moyenne des coins
        int[] corners = { px[0], px[w - 1], px[(h - 1) * w], px[h * w - 1] };
        int br = 0, bg = 0, bb = 0;
        foreach (var c in corners) { br += (c >> 16) & 255; bg += (c >> 8) & 255; bb += c & 255; }
        br /= 4; bg /= 4; bb /= 4;
        var seen = new bool[w * h];
        var q = new Queue<int>();
        for (int x = 0; x < w; x++) { q.Enqueue(x); q.Enqueue((h - 1) * w + x); }
        for (int y = 0; y < h; y++) { q.Enqueue(y * w); q.Enqueue(y * w + w - 1); }
        while (q.Count > 0)
        {
            int i = q.Dequeue();
            if (i < 0 || i >= px.Length || seen[i]) continue;
            seen[i] = true;
            int c = px[i];
            int dr = ((c >> 16) & 255) - br, dg = ((c >> 8) & 255) - bg, db = (c & 255) - bb;
            if (Math.Abs(dr) + Math.Abs(dg) + Math.Abs(db) > tol) continue;
            px[i] = 0;
            int x = i % w;
            if (x > 0) q.Enqueue(i - 1);
            if (x < w - 1) q.Enqueue(i + 1);
            q.Enqueue(i - w); q.Enqueue(i + w);
        }
        System.Runtime.InteropServices.Marshal.Copy(px, 0, data.Scan0, px.Length);
        bmp.UnlockBits(data);
    }

    // Recadre au plus près des pixels non transparents
    public static Bitmap Trim(Bitmap bmp, int pad)
    {
        int w = bmp.Width, h = bmp.Height, minX = w, minY = h, maxX = -1, maxY = -1;
        for (int y = 0; y < h; y++)
            for (int x = 0; x < w; x++)
                if (bmp.GetPixel(x, y).A > 20) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
        if (maxX < 0) return bmp;
        minX = Math.Max(0, minX - pad); minY = Math.Max(0, minY - pad);
        maxX = Math.Min(w - 1, maxX + pad); maxY = Math.Min(h - 1, maxY + pad);
        return Crop(bmp, minX, minY, maxX - minX + 1, maxY - minY + 1);
    }

    // Redimensionne dans un carré size×size (centré, fond transparent)
    public static Bitmap Fit(Bitmap src, int size)
    {
        var dst = new Bitmap(size, size, PixelFormat.Format32bppArgb);
        double k = Math.Min((double)size / src.Width, (double)size / src.Height);
        int w = (int)Math.Round(src.Width * k), h = (int)Math.Round(src.Height * k);
        using (var g = Graphics.FromImage(dst))
        {
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.Clear(Color.Transparent);
            g.DrawImage(src, (size - w) / 2, (size - h) / 2, w, h);
        }
        return dst;
    }

    // Remplit tout le carré (recadrage centré, sans bords transparents)
    public static Bitmap Cover(Bitmap src, int size)
    {
        var dst = new Bitmap(size, size, PixelFormat.Format32bppArgb);
        double k = Math.Max((double)size / src.Width, (double)size / src.Height);
        int w = (int)Math.Round(src.Width * k), h = (int)Math.Round(src.Height * k);
        using (var g = Graphics.FromImage(dst))
        {
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.DrawImage(src, (size - w) / 2, (size - h) / 2, w, h);
        }
        return dst;
    }

    // Boîte englobante des pixels non blancs dans une zone (pour trouver l'icône sur la planche)
    public static Rectangle Bounds(Bitmap bmp, int x0, int y0, int x1, int y1, int whiteTol)
    {
        int minX = x1, minY = y1, maxX = x0, maxY = y0;
        for (int y = y0; y < y1; y++)
            for (int x = x0; x < x1; x++)
            {
                var c = bmp.GetPixel(x, y);
                if (255 * 3 - (c.R + c.G + c.B) > whiteTol) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
            }
        return new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);
    }

    // Repère chaque forme non transparente (un badge = une forme) et renvoie leurs rectangles, triés par ligne puis colonne
    public static List<Rectangle> Components(Bitmap bmp, int minArea)
    {
        int w = bmp.Width, h = bmp.Height;
        var data = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var px = new int[w * h];
        System.Runtime.InteropServices.Marshal.Copy(data.Scan0, px, 0, px.Length);
        bmp.UnlockBits(data);
        var seen = new bool[w * h];
        var rects = new List<Rectangle>();
        var q = new Queue<int>();
        for (int s = 0; s < px.Length; s++)
        {
            if (seen[s] || ((px[s] >> 24) & 255) < 30) continue;
            int minX = w, minY = h, maxX = 0, maxY = 0, count = 0;
            q.Enqueue(s); seen[s] = true;
            while (q.Count > 0)
            {
                int i = q.Dequeue(); count++;
                int x = i % w, y = i / w;
                if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
                int[] nb = { x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w };
                foreach (int n in nb)
                    if (n >= 0 && n < px.Length && !seen[n] && ((px[n] >> 24) & 255) >= 30) { seen[n] = true; q.Enqueue(n); }
            }
            if (count >= minArea) rects.Add(new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1));
        }
        rects.Sort((a, b) => {
            int ra = (a.Y + a.Height / 2) / 200, rb = (b.Y + b.Height / 2) / 200;
            return ra != rb ? ra.CompareTo(rb) : a.X.CompareTo(b.X);
        });
        return rects;
    }

    public static void Save(Bitmap bmp, string path) { bmp.Save(path, ImageFormat.Png); }
}
